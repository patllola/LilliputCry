using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Admin.DTOs;

/// <summary>
/// Headline numbers for the admin screen. Counts cover non-admin users and are based on
/// *effective* tier — someone who chose Family but whose plan lapsed counts as Free.
/// </summary>
public record AdminStatsDto(
    int TotalUsers,
    int FreeUsers,
    int PlusUsers,
    int FamilyUsers,
    /// Users who chose a paid tier but whose plan has run out.
    int LapsedUsers,
    int AdminUsers,
    /// Sum of each paying user's actual tier price, with yearly billing spread over 12 months.
    decimal EstimatedMonthlyRevenue
);

public record AdminUserDto(
    int Id,
    Guid GuidId,
    string FullName,
    string Email,
    string Role,
    /// Stored choice: "free" | "plus" | "family".
    string PlanTier,
    /// What's actually enforced right now — differs from PlanTier once a paid plan lapses.
    string EffectivePlanTier,
    string BillingCycle,
    DateTime? PlanSelectedAt,
    DateTime? PlanExpiresAt,
    bool HasPaidAccess,
    DateTime CreatedAt
);

/// <summary>
/// Grants a paid tier for a number of months. <c>PlanTier</c> is optional — omitting it
/// extends whatever paid tier the user already chose, falling back to Plus.
/// </summary>
public record GrantPlanDto(
    [Range(1, 24)] int Months = 1,
    string? PlanTier = null
);
