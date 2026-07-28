using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Subscriptions.Services;

/// <summary>
/// Answers "what is this user actually entitled to right now?".
///
/// There is no trial and no locked-out state: Free is a real plan that never expires, so
/// the only question is whether a *paid* tier has time left on it. A lapsed paid plan
/// falls back to Free limits rather than blocking access.
/// </summary>
public class PlanLimitService(AppDbContext db)
{
    public sealed record Entitlement(PlanTier Tier, PlanDefinition Plan, bool HasPaidAccess);

    private static readonly Entitlement FreeEntitlement = new(PlanTier.Free, PlanCatalog.Free, false);

    public async Task<Entitlement> GetEntitlementAsync(int userId)
    {
        var user = await db.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.Role, u.PlanTier, u.PlanExpiresAt })
            .FirstOrDefaultAsync();

        if (user is null) return FreeEntitlement;

        // Admins are never limited — they need to be able to inspect any account.
        if (user.Role == UserRole.Admin)
            return new(PlanTier.Family, PlanCatalog.Family, true);

        return Resolve(user.PlanTier, user.PlanExpiresAt);
    }

    /// <summary>
    /// The entitlement rule in one place: a paid tier counts only while it has time left.
    /// </summary>
    public static Entitlement Resolve(PlanTier tier, DateTime? planExpiresAt)
    {
        if (tier == PlanTier.Free) return FreeEntitlement;

        var paidAccess = planExpiresAt.HasValue && planExpiresAt.Value > DateTime.UtcNow;
        return paidAccess
            ? new(tier, PlanCatalog.For(tier), true)
            : FreeEntitlement;
    }

    /// <summary>
    /// Oldest timestamp this user is allowed to read back, or null for unlimited history.
    /// Free tier only keeps a 7-day window visible.
    /// </summary>
    public async Task<DateTime?> GetHistoryCutoffAsync(int userId)
    {
        var entitlement = await GetEntitlementAsync(userId);
        return entitlement.Plan.HistoryDays is { } days
            ? DateTime.UtcNow.AddDays(-days)
            : null;
    }
}
