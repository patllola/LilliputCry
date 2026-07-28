using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Medications.DTOs;
using TinyTrack.Api.Features.Medications.Models;

namespace TinyTrack.Api.Features.Medications.Services;

public class MedicationService(AppDbContext db, BabyService babyService)
{
    // Medications are a standing schedule rather than history, so no plan history window
    // applies — a Free-tier user still needs to see today's doses.
    public async Task<List<MedicationResponseDto>> GetAllAsync(int userId, int? babyId = null)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);

        var query = db.Medications.Include(x => x.Baby).AsQueryable();

        query = babyId is not null
            ? query.Where(x => x.BabyId == babyId)
            : query.Where(x => x.UserId == userId
                               || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value)));

        return await query
            .OrderBy(x => x.TimeOfDay)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<MedicationResponseDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);
        return await db.Medications
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId
                        && (x.UserId == userId
                            || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value))))
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();
    }

    public async Task<(MedicationResponseDto? dto, ValidationError? error)> CreateAsync(CreateMedicationDto input, int userId)
    {
        var error = Validate(input.Name, input.TimeOfDay);
        if (error is not null) return (null, error);

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
        if (babyError is not null) return (null, babyError);

        var medication = new Medication
        {
            UserId = userId,
            BabyId = babyIntId,
            Name = input.Name,
            Dose = input.Dose,
            TimeOfDay = input.TimeOfDay,
            RepeatDaily = input.RepeatDaily,
            ReminderEnabled = input.ReminderEnabled,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Medications.Add(medication);
        await db.SaveChangesAsync();
        // Re-read so the Baby navigation is populated and the response carries babyId.
        return (await GetByIdAsync(medication.GuidId, userId), null);
    }

    public async Task<(MedicationResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateMedicationDto input, int userId)
    {
        var medication = await db.Medications.Include(x => x.Baby).FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (medication is null) return (null, "not_found", null);
        if (!await babyService.CanModifyRecordAsync(medication.BabyId, medication.UserId, userId))
            return (null, "not_found", null);

        var newName = input.Name ?? medication.Name;
        var newTime = input.TimeOfDay ?? medication.TimeOfDay;

        var error = Validate(newName, newTime);
        if (error is not null) return (null, null, error);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
            if (babyError is not null) return (null, null, babyError);
            medication.BabyId = babyIntId;
        }

        medication.Name = newName;
        medication.Dose = input.Dose ?? medication.Dose;
        medication.TimeOfDay = newTime;
        medication.RepeatDaily = input.RepeatDaily ?? medication.RepeatDaily;
        medication.ReminderEnabled = input.ReminderEnabled ?? medication.ReminderEnabled;

        await db.SaveChangesAsync();
        return (await GetByIdAsync(guidId, userId), null, null);
    }

    /// <summary>
    /// Marking a dose given is shared state: whoever ticks it, every caregiver sees it.
    /// That's the point of the feature, so this needs only Log access.
    /// </summary>
    public async Task<(MedicationResponseDto? dto, string? notFound)> ToggleDoneAsync(Guid guidId, int userId)
    {
        var medication = await db.Medications.Include(x => x.Baby).FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (medication is null) return (null, "not_found");
        if (!await babyService.CanModifyRecordAsync(medication.BabyId, medication.UserId, userId))
            return (null, "not_found");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var effectiveDone = medication.IsDoneToday && medication.LastToggledDate == today;

        medication.IsDoneToday = !effectiveDone;
        medication.LastToggledDate = today;

        await db.SaveChangesAsync();
        return (ToDto(medication), null);
    }

    public async Task<(MedicationResponseDto? dto, string? notFound)> ToggleReminderAsync(Guid guidId, int userId)
    {
        var medication = await db.Medications.Include(x => x.Baby).FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (medication is null) return (null, "not_found");
        if (!await babyService.CanModifyRecordAsync(medication.BabyId, medication.UserId, userId))
            return (null, "not_found");

        medication.ReminderEnabled = !medication.ReminderEnabled;

        await db.SaveChangesAsync();
        return (ToDto(medication), null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var medication = await db.Medications.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (medication is null) return false;
        if (!await babyService.CanModifyRecordAsync(medication.BabyId, medication.UserId, userId)) return false;

        db.Medications.Remove(medication);
        await db.SaveChangesAsync();
        return true;
    }

    private static ValidationError? Validate(string name, string timeOfDay)
    {
        if (string.IsNullOrWhiteSpace(name)) return new("name", "Name is required");
        if (string.IsNullOrWhiteSpace(timeOfDay)) return new("timeOfDay", "Time is required");
        return null;
    }

    private static MedicationResponseDto ToDto(Medication x)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return new(
            x.Id,
            x.GuidId,
            x.Baby?.GuidId,
            x.Name,
            x.Dose,
            x.TimeOfDay,
            x.RepeatDaily,
            x.ReminderEnabled,
            x.IsDoneToday && x.LastToggledDate == today,
            x.CreatedAt,
            x.UpdatedAt
        );
    }
}
