using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Admin.DTOs;

public record AdminStatsDto(
    int TotalUsers,
    int ActiveTrialUsers,
    int ExpiredTrialUsers,
    int ActivePaidUsers,
    int ExpiredPaidUsers,
    int AdminUsers,
    decimal EstimatedMonthlyRevenue
);

public record AdminUserDto(
    int Id,
    Guid GuidId,
    string FullName,
    string Email,
    string Role,
    string SubscriptionStatus,
    DateTime? TrialStartedAt,
    DateTime? TrialEndsAt,
    DateTime? SubscriptionStartedAt,
    DateTime? SubscriptionExpiresAt,
    bool HasActiveAccess,
    DateTime CreatedAt
);

public record ActivateSubscriptionDto(
    [Range(1, 12)] int Months = 1
);
