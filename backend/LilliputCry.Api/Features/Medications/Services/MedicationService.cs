using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Medications.DTOs;
using TinyTrack.Api.Features.Medications.Models;

namespace TinyTrack.Api.Features.Medications.Services;

public class MedicationService(AppDbContext db, BabyService babyService)
{
    public async Task<List<MedicationResponseDto>> GetAllAsync(int userId, int? babyId = null) =>
        await db.Medications
            .Include(x => x.Baby)
            .Where(x => x.UserId == userId && (babyId == null || x.BabyId == babyId))
            .OrderBy(x => x.TimeOfDay)
            .Select(x => ToDto(x))
            .ToListAsync();

    public async Task<MedicationResponseDto?> GetByIdAsync(Guid guidId, int userId) =>
        await db.Medications
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();

    public async Task<(MedicationResponseDto? dto, ValidationError? error)> CreateAsync(CreateMedicationDto input, int userId)
    {
        var error = Validate(input.Name, input.TimeOfDay);
        if (error is not null) return (null, error);

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
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
        return (ToDto(medication), null);
    }

    public async Task<(MedicationResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateMedicationDto input, int userId)
    {
        var medication = await db.Medications.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (medication is null) return (null, "not_found", null);

        var newName = input.Name ?? medication.Name;
        var newTime = input.TimeOfDay ?? medication.TimeOfDay;

        var error = Validate(newName, newTime);
        if (error is not null) return (null, null, error);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
            if (babyError is not null) return (null, null, babyError);
            medication.BabyId = babyIntId;
        }

        medication.Name = newName;
        medication.Dose = input.Dose ?? medication.Dose;
        medication.TimeOfDay = newTime;
        medication.RepeatDaily = input.RepeatDaily ?? medication.RepeatDaily;
        medication.ReminderEnabled = input.ReminderEnabled ?? medication.ReminderEnabled;

        await db.SaveChangesAsync();
        return (ToDto(medication), null, null);
    }

    public async Task<(MedicationResponseDto? dto, string? notFound)> ToggleDoneAsync(Guid guidId, int userId)
    {
        var medication = await db.Medications.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (medication is null) return (null, "not_found");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var effectiveDone = medication.IsDoneToday && medication.LastToggledDate == today;

        medication.IsDoneToday = !effectiveDone;
        medication.LastToggledDate = today;

        await db.SaveChangesAsync();
        return (ToDto(medication), null);
    }

    public async Task<(MedicationResponseDto? dto, string? notFound)> ToggleReminderAsync(Guid guidId, int userId)
    {
        var medication = await db.Medications.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (medication is null) return (null, "not_found");

        medication.ReminderEnabled = !medication.ReminderEnabled;

        await db.SaveChangesAsync();
        return (ToDto(medication), null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.Medications
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
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
