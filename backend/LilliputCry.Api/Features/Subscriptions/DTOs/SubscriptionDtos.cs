using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Subscriptions.DTOs;

/// <summary>
/// Mirrors the mobile app's `Plan` type, plus the limit fields the client can't
/// know on its own. <c>id</c> is the lowercase wire form ("free" | "plus" | "family").
/// A null limit means unlimited.
/// </summary>
public record PlanResponseDto(
    string Id,
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

/// <summary>
/// What the caller is actually entitled to right now. <c>planId</c> is the stored choice;
/// <c>effectivePlanId</c> is what's enforced — they differ once a paid plan lapses and the
/// user falls back to Free.
/// </summary>
public record MySubscriptionResponseDto(
    string PlanId,
    string Billing,
    string EffectivePlanId,
    bool HasPaidAccess,
    DateTime? PlanSelectedAt,
    DateTime? PlanExpiresAt,
    int? MaxBabies,
    int? HistoryDays,
    int CaregiverSeats,
    int BabiesUsed,
    int CaregiverSeatsUsed
);

public record SelectPlanDto(
    [Required] string PlanId,
    [Required] string Billing
);
