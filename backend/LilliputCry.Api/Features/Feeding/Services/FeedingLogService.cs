using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.DTOs;
using TinyTrack.Api.Features.Feeding.Models;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace TinyTrack.Api.Features.Feeding.Services;

public class FeedingLogService(AppDbContext db, BabyService babyService, PlanLimitService planLimits)
{
    /// <summary>
    /// Scoped to what the caller may read: rows they authored, plus every row belonging
    /// to a baby shared with them. Free-tier callers are additionally clamped to their
    /// plan's history window.
    /// </summary>
    public async Task<List<FeedingLogResponseDto>> GetAllAsync(
        int userId, int? babyId = null, int page = 1, int pageSize = 50,
        DateTime? from = null, DateTime? to = null)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);
        from = ClampToPlanWindow(from, await planLimits.GetHistoryCutoffAsync(userId));

        var query = db.FeedingLogs.Include(x => x.Baby).AsQueryable();

        query = babyId is not null
            ? query.Where(x => x.BabyId == babyId)
            : query.Where(x => x.UserId == userId
                               || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value)));

        if (from is not null) query = query.Where(x => x.FedAt >= from);
        if (to is not null) query = query.Where(x => x.FedAt <= to);

        return await query
            .OrderByDescending(x => x.FedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<FeedingLogResponseDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var accessibleBabyIds = await babyService.GetAccessibleBabyIdsAsync(userId);
        return await db.FeedingLogs
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId
                        && (x.UserId == userId
                            || (x.BabyId != null && accessibleBabyIds.Contains(x.BabyId.Value))))
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();
    }

    public async Task<(FeedingLogResponseDto? dto, ValidationError? error)> CreateAsync(CreateFeedingLogDto input, int userId)
    {
        var error = Validate(input.MilkPrepared, input.MilkFed, input.FedAt);
        if (error is not null) return (null, error);

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
        if (babyError is not null) return (null, babyError);

        var log = new FeedingLog
        {
            UserId = userId,
            BabyId = babyIntId,
            FedAt = DateTime.SpecifyKind(input.FedAt, DateTimeKind.Utc),
            MilkPrepared = input.MilkPrepared,
            MilkFed = input.MilkFed,
            Notes = input.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.FeedingLogs.Add(log);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(log.GuidId, userId), null);
    }

    public async Task<(FeedingLogResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateFeedingLogDto input, int userId)
    {
        var log = await db.FeedingLogs.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (log is null) return (null, "not_found", null);

        // 404 rather than 403 for rows the caller can't touch, so the endpoint can't be
        // used to confirm a log id exists.
        if (!await babyService.CanModifyRecordAsync(log.BabyId, log.UserId, userId))
            return (null, "not_found", null);

        var newPrepared = input.MilkPrepared ?? log.MilkPrepared;
        var newFed = input.MilkFed ?? log.MilkFed;
        var newFedAt = input.FedAt ?? log.FedAt;

        var error = Validate(newPrepared, newFed, newFedAt);
        if (error is not null) return (null, null, error);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Log);
            if (babyError is not null) return (null, null, babyError);
            log.BabyId = babyIntId;
        }

        log.FedAt = DateTime.SpecifyKind(newFedAt, DateTimeKind.Utc);
        log.MilkPrepared = newPrepared;
        log.MilkFed = newFed;
        log.Notes = input.Notes ?? log.Notes;

        await db.SaveChangesAsync();
        return (await GetByIdAsync(guidId, userId), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var log = await db.FeedingLogs.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (log is null) return false;
        if (!await babyService.CanModifyRecordAsync(log.BabyId, log.UserId, userId)) return false;

        db.FeedingLogs.Remove(log);
        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Pushes a caller-supplied <paramref name="from"/> forward to the plan's cutoff when
    /// the plan is more restrictive, so a client can't widen its own history window.
    /// </summary>
    internal static DateTime? ClampToPlanWindow(DateTime? from, DateTime? planCutoff)
    {
        if (planCutoff is null) return from;
        return from is null || from < planCutoff ? planCutoff : from;
    }

    private static ValidationError? Validate(decimal prepared, decimal fed, DateTime fedAt)
    {
        if (prepared <= 0) return new("milkPrepared", "Must be greater than 0");
        if (fed < 0) return new("milkFed", "Cannot be negative");
        if (fed > prepared) return new("milkFed", "Cannot exceed milk prepared");
        if (fedAt > DateTime.UtcNow.AddMinutes(5)) return new("fedAt", "Cannot be in the future");
        return null;
    }

    private static FeedingLogResponseDto ToDto(FeedingLog x) => new(
        x.Id,
        x.GuidId,
        x.Baby != null ? x.Baby.GuidId : null,
        x.FedAt,
        x.MilkPrepared,
        x.MilkFed,
        x.MilkPrepared - x.MilkFed,
        x.Notes,
        x.CreatedAt,
        x.UpdatedAt
    );
}

public record ValidationError(string Field, string Message);
