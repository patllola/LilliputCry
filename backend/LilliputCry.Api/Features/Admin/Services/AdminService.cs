using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Admin.DTOs;
using TinyTrack.Api.Features.Subscriptions;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Subscriptions.Services;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Admin.Services;

public class AdminService(AppDbContext db)
{
    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var users = await db.Users
            .Select(u => new { u.Role, u.PlanTier, u.BillingCycle, u.PlanExpiresAt })
            .ToListAsync();

        var members = users.Where(u => u.Role == UserRole.User).ToList();

        // Bucket by what each user is actually entitled to, not what they picked.
        var effective = members
            .Select(u => new
            {
                u.PlanTier,
                u.BillingCycle,
                Entitlement = PlanLimitService.Resolve(u.PlanTier, u.PlanExpiresAt)
            })
            .ToList();

        return new AdminStatsDto(
            TotalUsers: members.Count,
            FreeUsers: effective.Count(e => e.Entitlement.Tier == PlanTier.Free),
            PlusUsers: effective.Count(e => e.Entitlement.Tier == PlanTier.Plus),
            FamilyUsers: effective.Count(e => e.Entitlement.Tier == PlanTier.Family),
            // Chose a paid tier, but it isn't live — the upgrade-recovery pool.
            LapsedUsers: effective.Count(e => e.PlanTier != PlanTier.Free && !e.Entitlement.HasPaidAccess),
            AdminUsers: users.Count(u => u.Role == UserRole.Admin),
            EstimatedMonthlyRevenue: effective
                .Where(e => e.Entitlement.HasPaidAccess)
                .Sum(e => MonthlyValue(e.Entitlement.Tier, e.BillingCycle))
        );
    }

    /// <summary>
    /// A yearly subscription is worth a twelfth of its price each month, so mixing billing
    /// cycles doesn't inflate the figure. Rounded to cents.
    /// </summary>
    private static decimal MonthlyValue(PlanTier tier, BillingCycle cycle) =>
        cycle == BillingCycle.Yearly
            ? Math.Round(PlanCatalog.PriceFor(tier, BillingCycle.Yearly) / 12m, 2)
            : PlanCatalog.PriceFor(tier, BillingCycle.Monthly);

    public async Task<List<AdminUserDto>> GetUsersAsync(int page = 1, int pageSize = 50)
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return [.. users.Select(ToDto)];
    }

    /// <summary>
    /// Grants or extends paid access. An already-live plan is extended from its existing
    /// expiry so an admin topping someone up doesn't shorten their remaining time.
    /// </summary>
    public async Task<(AdminUserDto? dto, string? error)> GrantPlanAsync(Guid userGuid, GrantPlanDto input)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GuidId == userGuid);
        if (user is null) return (null, "not_found");
        if (user.Role == UserRole.Admin) return (null, "cannot_set_plan_for_admin");

        PlanTier tier;
        if (input.PlanTier is not null)
        {
            if (!TryParseTier(input.PlanTier, out tier)) return (null, "invalid_plan_tier");
            if (tier == PlanTier.Free) return (null, "use_revoke_to_move_a_user_to_free");
        }
        else
        {
            // No tier given — extend what they already chose, or start them on Plus.
            tier = user.PlanTier == PlanTier.Free ? PlanTier.Plus : user.PlanTier;
        }

        var now = DateTime.UtcNow;
        var stillLive = user.PlanExpiresAt.HasValue && user.PlanExpiresAt.Value > now;
        var baseDate = stillLive ? user.PlanExpiresAt!.Value : now;

        user.PlanTier = tier;
        user.PlanExpiresAt = baseDate.AddMonths(input.Months);
        user.PlanSelectedAt ??= now;
        user.UpdatedAt = now;

        await db.SaveChangesAsync();
        return (ToDto(user), null);
    }

    /// <summary>Drops a user back to Free immediately.</summary>
    public async Task<(AdminUserDto? dto, string? error)> RevokePlanAsync(Guid userGuid)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GuidId == userGuid);
        if (user is null) return (null, "not_found");
        if (user.Role == UserRole.Admin) return (null, "cannot_revoke_admin");

        user.PlanTier = PlanTier.Free;
        user.PlanExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return (ToDto(user), null);
    }

    private static bool TryParseTier(string value, out PlanTier tier)
    {
        tier = PlanTier.Free;
        switch (value.Trim().ToLowerInvariant())
        {
            case "free": tier = PlanTier.Free; return true;
            case "plus": tier = PlanTier.Plus; return true;
            case "family": tier = PlanTier.Family; return true;
            default: return false;
        }
    }

    private static AdminUserDto ToDto(User u)
    {
        var entitlement = u.Role == UserRole.Admin
            ? new PlanLimitService.Entitlement(PlanTier.Family, PlanCatalog.Family, true)
            : PlanLimitService.Resolve(u.PlanTier, u.PlanExpiresAt);

        return new AdminUserDto(
            u.Id,
            u.GuidId,
            u.FullName,
            u.Email,
            u.Role.ToString(),
            u.PlanTier.ToString().ToLowerInvariant(),
            entitlement.Tier.ToString().ToLowerInvariant(),
            u.BillingCycle.ToString().ToLowerInvariant(),
            u.PlanSelectedAt,
            u.PlanExpiresAt,
            entitlement.HasPaidAccess,
            u.CreatedAt
        );
    }
}
