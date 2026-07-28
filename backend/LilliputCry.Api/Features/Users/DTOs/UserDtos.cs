using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Users.DTOs;

public record UserProfileResponseDto(
    int Id,
    Guid GuidId,
    string FullName,
    string Email,
    string? ProfilePictureUrl,
    string? PhoneNumber,
    string? Country,
    string? State,
    string? City,
    string? Gender,
    string? Address,
    DateTime CreatedAt,
    string Role,
    /// Stored plan choice: "free" | "plus" | "family".
    string PlanTier,
    /// "monthly" | "yearly".
    string BillingCycle,
    /// When paid access lapses. Null on Free, or on a paid tier not yet paid for.
    DateTime? PlanExpiresAt
);

public record UpdateUserProfileDto(
    [Required, MaxLength(100)] string FullName,
    [Required, EmailAddress, MaxLength(255)] string Email,
    string? ProfilePictureUrl,
    [MaxLength(20)] string? PhoneNumber,
    [MaxLength(50)] string? Country,
    [MaxLength(50)] string? State,
    [MaxLength(50)] string? City,
    [MaxLength(20)] string? Gender,
    [MaxLength(255)] string? Address
);
