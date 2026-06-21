using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Sleep.DTOs;
using TinyTrack.Api.Features.Sleep.Model;

namespace TinyTrack.Api.Features.Sleep.Services;

public class SleepLogService(AppDbContext db)
{
    public async Task<List<SleepLogResponseDto>> GetAllAsync(int userId, int page = 1, int pageSize = 50) =>
        await db.SleepLogs
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.SleepStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync();

    public async Task<SleepLogResponseDto?> GetByIdAsync(Guid guidId, int userId) =>
        await db.SleepLogs
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();

    public async Task<(SleepLogResponseDto? dto, ValidationError? error)> CreateAsync(CreateSleepLogDto input, int userId)
    {
        var error = Validate(input.SleepStart, input.SleepEnd);
        if (error is not null) return (null, error);

        var log = new SleepingLog
        {
            UserId = userId,
            SleepStart = DateTime.SpecifyKind(input.SleepStart, DateTimeKind.Utc),
            SleepEnd = DateTime.SpecifyKind(input.SleepEnd, DateTimeKind.Utc),
            IsNap = input.IsNap,
            Notes = input.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.SleepLogs.Add(log);
        await db.SaveChangesAsync();
        return (ToDto(log), null);
    }

    public async Task<(SleepLogResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateSleepLogDto input, int userId)
    {
        var log = await db.SleepLogs.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (log is null) return (null, "not_found", null);

        var newStart = input.SleepStart ?? log.SleepStart;
        var newEnd = input.SleepEnd ?? log.SleepEnd;

        var error = Validate(newStart, newEnd);
        if (error is not null) return (null, null, error);

        log.SleepStart = DateTime.SpecifyKind(newStart, DateTimeKind.Utc);
        log.SleepEnd = DateTime.SpecifyKind(newEnd, DateTimeKind.Utc);
        log.IsNap = input.IsNap ?? log.IsNap;
        log.Notes = input.Notes ?? log.Notes;

        await db.SaveChangesAsync();
        return (ToDto(log), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.SleepLogs
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
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
        x.SleepStart,
        x.SleepEnd,
        (x.SleepEnd - x.SleepStart).TotalMinutes,
        x.IsNap,
        x.Notes,
        x.CreatedAt,
        x.UpdatedAt
    );
}
