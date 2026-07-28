using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Subscriptions.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;

namespace TinyTrack.Api.Features.Subscriptions.Services;

public class SubscriptionService(AppDbContext db, PlanLimitService planLimits)
{
    public static List<PlanResponseDto> GetPlans() =>
        [.. PlanCatalog.All.Select(ToDto)];

    public async Task<MySubscriptionResponseDto?> GetMineAsync(int userId)
    {
        var user = await db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.PlanTier,
                u.BillingCycle,
                u.PlanSelectedAt,
                u.PlanExpiresAt
            })
            .FirstOrDefaultAsync();

        if (user is null) return null;

        var entitlement = await planLimits.GetEntitlementAsync(userId);

        var ownedBabyIds = await db.Babies.Where(b => b.UserId == userId).Select(b => b.Id).ToListAsync();
        var now = DateTime.UtcNow;
        var seatsUsed =
            await db.CaregiverAccess.CountAsync(a => ownedBabyIds.Contains(a.BabyId)) +
            await db.CaregiverInvites.CountAsync(i =>
                ownedBabyIds.Contains(i.BabyId)
                && i.Status == CaregiverInviteStatus.Pending
                && i.ExpiresAt > now);

        return new MySubscriptionResponseDto(
            user.PlanTier.ToString().ToLowerInvariant(),
            user.BillingCycle.ToString().ToLowerInvariant(),
            entitlement.Tier.ToString().ToLowerInvariant(),
            entitlement.HasPaidAccess,
            user.PlanSelectedAt,
            user.PlanExpiresAt,
            entitlement.Plan.MaxBabies,
            entitlement.Plan.HistoryDays,
            entitlement.Plan.CaregiverSeats,
            ownedBabyIds.Count,
            seatsUsed);
    }

    /// <summary>
    /// Records the tier the user picked. Downgrading to Free always succeeds and takes
    /// effect at once. Choosing a paid tier is recorded but does not grant it: the caller
    /// gets <c>requiresPayment</c> so it can route to checkout, and the paid limits only
    /// apply once PlanExpiresAt is set by an admin — or, later, a payment webhook.
    /// </summary>
    public async Task<(MySubscriptionResponseDto? dto, bool requiresPayment, ValidationError? error)> SelectPlanAsync(
        SelectPlanDto input, int userId)
    {
        if (!TryParsePlan(input.PlanId, out var tier))
            return (null, false, new("planId", "Plan must be one of: free, plus, family"));

        if (!TryParseBilling(input.Billing, out var billing))
            return (null, false, new("billing", "Billing must be one of: monthly, yearly"));

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return (null, false, new("user", "User not found"));

        user.PlanTier = tier;
        user.BillingCycle = billing;
        user.PlanSelectedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var entitlement = await planLimits.GetEntitlementAsync(userId);

        // Wanted a paid tier but isn't entitled to one yet — the client should send them to pay.
        var requiresPayment = tier != PlanTier.Free && entitlement.Tier != tier;

        return (await GetMineAsync(userId), requiresPayment, null);
    }

    private static PlanResponseDto ToDto(PlanDefinition p) => new(
        p.Tier.ToString().ToLowerInvariant(),
        p.Name,
        p.Badge,
        p.Tagline,
        p.Monthly,
        p.Yearly,
        p.Features,
        p.MaxBabies,
        p.HistoryDays,
        p.CaregiverSeats
    );

    private static bool TryParsePlan(string? value, out PlanTier tier)
    {
        tier = PlanTier.Free;
        if (string.IsNullOrWhiteSpace(value)) return false;
        switch (value.Trim().ToLowerInvariant())
        {
            case "free": tier = PlanTier.Free; return true;
            case "plus": tier = PlanTier.Plus; return true;
            case "family": tier = PlanTier.Family; return true;
            default: return false;
        }
    }

    private static bool TryParseBilling(string? value, out BillingCycle cycle)
    {
        cycle = BillingCycle.Monthly;
        if (string.IsNullOrWhiteSpace(value)) return false;
        switch (value.Trim().ToLowerInvariant())
        {
            case "monthly": cycle = BillingCycle.Monthly; return true;
            case "yearly": cycle = BillingCycle.Yearly; return true;
            default: return false;
        }
    }
}
