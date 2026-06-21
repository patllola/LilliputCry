using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Admin.DTOs;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Admin.Services;

public class AdminService(AppDbContext db)
{
    private const decimal MonthlyPrice = 10m;

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var users = await db.Users
            .Select(u => new
            {
                u.Role,
                u.SubscriptionStatus,
                u.TrialEndsAt,
                u.SubscriptionExpiresAt
            })
            .ToListAsync();

        int totalUsers       = users.Count(u => u.Role == UserRole.User);
        int adminUsers       = users.Count(u => u.Role == UserRole.Admin);
        int activeTrialUsers = users.Count(u => u.Role == UserRole.User
                                             && u.SubscriptionStatus == SubscriptionStatus.Trial
                                             && u.TrialEndsAt.HasValue && u.TrialEndsAt.Value > now);
        int expiredTrialUsers = users.Count(u => u.Role == UserRole.User
                                              && u.SubscriptionStatus == SubscriptionStatus.Trial
                                              && (!u.TrialEndsAt.HasValue || u.TrialEndsAt.Value <= now));
        int activePaidUsers  = users.Count(u => u.Role == UserRole.User
                                             && u.SubscriptionStatus == SubscriptionStatus.Active
                                             && u.SubscriptionExpiresAt.HasValue && u.SubscriptionExpiresAt.Value > now);
        int expiredPaidUsers = users.Count(u => u.Role == UserRole.User
                                             && u.SubscriptionStatus == SubscriptionStatus.Active
                                             && (!u.SubscriptionExpiresAt.HasValue || u.SubscriptionExpiresAt.Value <= now));

        return new AdminStatsDto(
            totalUsers,
            activeTrialUsers,
            expiredTrialUsers,
            activePaidUsers,
            expiredPaidUsers,
            adminUsers,
            activePaidUsers * MonthlyPrice
        );
    }

    public async Task<List<AdminUserDto>> GetUsersAsync(int page = 1, int pageSize = 50)
    {
        var now = DateTime.UtcNow;
        return await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.GuidId,
                u.FullName,
                u.Email,
                u.Role.ToString(),
                u.SubscriptionStatus.ToString(),
                u.TrialStartedAt,
                u.TrialEndsAt,
                u.SubscriptionStartedAt,
                u.SubscriptionExpiresAt,
                (u.SubscriptionStatus == SubscriptionStatus.Trial  && u.TrialEndsAt.HasValue             && u.TrialEndsAt.Value > now) ||
                (u.SubscriptionStatus == SubscriptionStatus.Active && u.SubscriptionExpiresAt.HasValue && u.SubscriptionExpiresAt.Value > now),
                u.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<(AdminUserDto? dto, string? error)> ActivateSubscriptionAsync(Guid userGuid, int months)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GuidId == userGuid);
        if (user is null) return (null, "not_found");
        if (user.Role == UserRole.Admin) return (null, "cannot_set_subscription_for_admin");

        var now = DateTime.UtcNow;
        // Extend from existing expiry if still active, otherwise from now
        var baseDate = user.SubscriptionStatus == SubscriptionStatus.Active
                       && user.SubscriptionExpiresAt.HasValue
                       && user.SubscriptionExpiresAt.Value > now
            ? user.SubscriptionExpiresAt.Value
            : now;

        user.SubscriptionStatus = SubscriptionStatus.Active;
        user.SubscriptionStartedAt ??= now;
        user.SubscriptionExpiresAt = baseDate.AddMonths(months);
        user.UpdatedAt = now;

        await db.SaveChangesAsync();
        return (ToDto(user, now), null);
    }

    public async Task<(AdminUserDto? dto, string? error)> RevokeSubscriptionAsync(Guid userGuid)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GuidId == userGuid);
        if (user is null) return (null, "not_found");
        if (user.Role == UserRole.Admin) return (null, "cannot_revoke_admin");

        var now = DateTime.UtcNow;
        user.SubscriptionStatus = SubscriptionStatus.Expired;
        user.SubscriptionExpiresAt = now;
        user.UpdatedAt = now;

        await db.SaveChangesAsync();
        return (ToDto(user, now), null);
    }

    private static AdminUserDto ToDto(User u, DateTime now) => new(
        u.Id,
        u.GuidId,
        u.FullName,
        u.Email,
        u.Role.ToString(),
        u.SubscriptionStatus.ToString(),
        u.TrialStartedAt,
        u.TrialEndsAt,
        u.SubscriptionStartedAt,
        u.SubscriptionExpiresAt,
        (u.SubscriptionStatus == SubscriptionStatus.Trial  && u.TrialEndsAt.HasValue             && u.TrialEndsAt.Value > now) ||
        (u.SubscriptionStatus == SubscriptionStatus.Active && u.SubscriptionExpiresAt.HasValue && u.SubscriptionExpiresAt.Value > now),
        u.CreatedAt
    );
}
