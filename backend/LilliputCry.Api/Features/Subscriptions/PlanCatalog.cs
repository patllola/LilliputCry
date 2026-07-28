using TinyTrack.Api.Features.Subscriptions.Models;

namespace TinyTrack.Api.Features.Subscriptions;

/// <summary>
/// What each tier costs and allows. Prices and copy mirror the mobile app's
/// payment-plan screen; the limits are the half the client can't enforce.
/// A null limit means unlimited.
/// </summary>
public sealed record PlanDefinition(
    PlanTier Tier,
    string Name,
    string? Badge,
    string Tagline,
    decimal Monthly,
    decimal Yearly,
    string[] Features,
    int? MaxBabies,
    int? HistoryDays,
    int CaregiverSeats
);

public static class PlanCatalog
{
    public static readonly PlanDefinition Free = new(
        PlanTier.Free,
        "Free",
        null,
        "The basics, one baby",
        0m,
        0m,
        ["Feeding & sleep logs", "1 baby profile", "7 days of history"],
        MaxBabies: 1,
        HistoryDays: 7,
        CaregiverSeats: 0
    );

    public static readonly PlanDefinition Plus = new(
        PlanTier.Plus,
        "Plus",
        "Popular",
        "For growing families",
        4.99m,
        47.90m,
        ["Everything in Free", "Up to 3 babies", "Medication reminders", "Unlimited history"],
        MaxBabies: 3,
        HistoryDays: null,
        CaregiverSeats: 0
    );

    public static readonly PlanDefinition Family = new(
        PlanTier.Family,
        "Family",
        "Best value",
        "Share with caregivers",
        8.99m,
        86.30m,
        ["Everything in Plus", "Unlimited babies", "Invite 4 caregivers", "Export & printable reports"],
        MaxBabies: null,
        HistoryDays: null,
        CaregiverSeats: 4
    );

    public static readonly IReadOnlyList<PlanDefinition> All = [Free, Plus, Family];

    public static PlanDefinition For(PlanTier tier) => tier switch
    {
        PlanTier.Plus => Plus,
        PlanTier.Family => Family,
        _ => Free
    };

    /// Price for a tier on a given billing cycle.
    public static decimal PriceFor(PlanTier tier, BillingCycle cycle)
    {
        var plan = For(tier);
        return cycle == BillingCycle.Yearly ? plan.Yearly : plan.Monthly;
    }
}
