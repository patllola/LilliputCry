using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Sleep.DTOs;
using TinyTrack.Api.Features.Sleep.Model;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace TinyTrack.Api.Features.Sleep.Services;

public class SleepLogService(AppDbContext db, BabyService babyService, PlanLimitService planLimits)
{
    public async Task<List<SleepLogResponseDto>> GetAllAsync(
        int userId, int? babyId = null, int page = 1, int pageSize = 50,
        DateTime? from = null, DateTime? to = null)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);
        from = FeedingLogService.ClampToPlanWindow(from, await planLimits.GetHistoryCutoffAsync(userId));

        var query = db.SleepLogs.Include(x => x.Baby).AsQueryable();

        query = babyId is not null
            ? query.Where(x => x.BabyId == babyId)
            : query.Where(x => x.UserId == userId
                               || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value)));

        if (from is not null) query = query.Where(x => x.SleepStart >= from);
        if (to is not null) query = query.Where(x => x.SleepStart <= to);

        return await query
            .OrderByDescending(x => x.SleepStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<SleepLogResponseDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);
        return await db.SleepLogs
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId
                        && (x.UserId == userId
                            || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value))))
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();
    }

    public async Task<(SleepLogResponseDto? dto, ValidationError? error)> CreateAsync(CreateSleepLogDto input, int userId)
    {
        var error = Validate(input.SleepStart, input.SleepEnd);
        if (error is not null) return (null, error);

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
        if (babyError is not null) return (null, babyError);

        var log = new SleepingLog
        {
            UserId = userId,
            BabyId = babyIntId,
            SleepStart = DateTime.SpecifyKind(input.SleepStart, DateTimeKind.Utc),
            SleepEnd = DateTime.SpecifyKind(input.SleepEnd, DateTimeKind.Utc),
            IsNap = input.IsNap,
            Notes = input.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.SleepLogs.Add(log);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(log.GuidId, userId), null);
    }

    public async Task<(SleepLogResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateSleepLogDto input, int userId)
    {
        var log = await db.SleepLogs.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (log is null) return (null, "not_found", null);
        if (!await babyService.CanModifyRecordAsync(log.BabyId, log.UserId, userId))
            return (null, "not_found", null);

        var newStart = input.SleepStart ?? log.SleepStart;
        var newEnd = input.SleepEnd ?? log.SleepEnd;

        var error = Validate(newStart, newEnd);
        if (error is not null) return (null, null, error);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
            if (babyError is not null) return (null, null, babyError);
            log.BabyId = babyIntId;
        }

        log.SleepStart = DateTime.SpecifyKind(newStart, DateTimeKind.Utc);
        log.SleepEnd = DateTime.SpecifyKind(newEnd, DateTimeKind.Utc);
        log.IsNap = input.IsNap ?? log.IsNap;
        log.Notes = input.Notes ?? log.Notes;

        await db.SaveChangesAsync();
        return (await GetByIdAsync(guidId, userId), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var log = await db.SleepLogs.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (log is null) return false;
        if (!await babyService.CanModifyRecordAsync(log.BabyId, log.UserId, userId)) return false;

        db.SleepLogs.Remove(log);
        await db.SaveChangesAsync();
        return true;
    }

    private static ValidationError? Validate(DateTime start, DateTime end)
    {
        if (start > DateTime.UtcNow.AddMinutes(5)) return new("sleepStart", "Cannot be in the future");
        if (end <= start) return new("sleepEnd", "Must be after sleep start");
        if ((end - start).TotalHours > 24) return new("sleepEnd", "Sleep duration cannot exceed 24 hours");
        return null;
    }

    private static SleepLogResponseDto ToDto(SleepingLog x) => new(
        x.Id,
        x.GuidId,
        x.Baby != null ? x.Baby.GuidId : null,
        x.SleepStart,
        x.SleepEnd,
        (x.SleepEnd - x.SleepStart).TotalMinutes,
        x.IsNap,
        x.Notes,
        x.CreatedAt,
        x.UpdatedAt
    );
}
