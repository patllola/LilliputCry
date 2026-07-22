using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Pump.DTOs;
using TinyTrack.Api.Features.Pump.Models;

namespace TinyTrack.Api.Features.Pump.Services;

public class PumpSessionService(AppDbContext db, BabyService babyService)
{
    public async Task<List<PumpSessionResponseDto>> GetAllAsync(int userId, int? babyId = null, int page = 1, int pageSize = 50) =>
        await db.PumpSessions
            .Include(x => x.Baby)
            .Where(x => x.UserId == userId && (babyId == null || x.BabyId == babyId))
            .OrderByDescending(x => x.PumpedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync();

    public async Task<PumpSessionResponseDto?> GetByIdAsync(Guid guidId, int userId) =>
        await db.PumpSessions
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();

    public async Task<(PumpSessionResponseDto? dto, ValidationError? error)> CreateAsync(CreatePumpSessionDto input, int userId)
    {
        var error = Validate(input.LeftAmount, input.RightAmount, input.PumpedAt);
        if (error is not null) return (null, error);

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
        if (babyError is not null) return (null, babyError);

        var session = new PumpSession
        {
            UserId = userId,
            BabyId = babyIntId,
            PumpedAt = DateTime.SpecifyKind(input.PumpedAt, DateTimeKind.Utc),
            LeftAmount = input.LeftAmount,
            RightAmount = input.RightAmount,
            Notes = input.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.PumpSessions.Add(session);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(session.GuidId, userId), null);
    }

    public async Task<(PumpSessionResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdatePumpSessionDto input, int userId)
    {
        var session = await db.PumpSessions.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (session is null) return (null, "not_found", null);

        var newLeft = input.LeftAmount ?? session.LeftAmount;
        var newRight = input.RightAmount ?? session.RightAmount;
        var newPumpedAt = input.PumpedAt ?? session.PumpedAt;

        var error = Validate(newLeft, newRight, newPumpedAt);
        if (error is not null) return (null, null, error);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
            if (babyError is not null) return (null, null, babyError);
            session.BabyId = babyIntId;
        }

        session.PumpedAt = DateTime.SpecifyKind(newPumpedAt, DateTimeKind.Utc);
        session.LeftAmount = newLeft;
        session.RightAmount = newRight;
        session.Notes = input.Notes ?? session.Notes;

        await db.SaveChangesAsync();
        return (await GetByIdAsync(guidId, userId), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.PumpSessions
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    private static ValidationError? Validate(decimal left, decimal right, DateTime pumpedAt)
    {
        if (left < 0) return new("leftAmount", "Cannot be negative");
        if (right < 0) return new("rightAmount", "Cannot be negative");
        if (left == 0 && right == 0) return new("leftAmount", "At least one side must be greater than 0");
        if (pumpedAt > DateTime.UtcNow.AddMinutes(5)) return new("pumpedAt", "Cannot be in the future");
        return null;
    }

    private static PumpSessionResponseDto ToDto(PumpSession x) => new(
        x.Id,
        x.GuidId,
        x.Baby != null ? x.Baby.GuidId : null,
        x.PumpedAt,
        x.LeftAmount,
        x.RightAmount,
        x.LeftAmount + x.RightAmount,
        x.Notes,
        x.CreatedAt,
        x.UpdatedAt
    );
}
