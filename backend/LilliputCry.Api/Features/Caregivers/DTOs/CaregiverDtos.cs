using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Caregivers.DTOs;

/// <summary>
/// Mirrors the mobile app's `Caregiver` type. <c>role</c> is the lowercase wire form
/// ("owner" | "full" | "log" | "read"); <c>color</c> reuses the baby's avatar palette so
/// the client has an avatar tint without a second lookup.
/// </summary>
public record CaregiverResponseDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Email,
    string Role,
    string Color,
    bool IsYou,
    DateTime? GrantedAt
);

public record PendingInviteResponseDto(
    Guid Id,
    string Email,
    string Role,
    DateTime InvitedAt,
    DateTime ExpiresAt,
    Guid BabyId,
    string BabyName
);

/// <summary>
/// Returned once, on create. <c>token</c> is the only time the secret is exposed —
/// the client is responsible for delivering it (share sheet, email) to the invitee.
/// </summary>
public record CreatedInviteResponseDto(
    Guid Id,
    string Email,
    string Role,
    DateTime InvitedAt,
    DateTime ExpiresAt,
    Guid BabyId,
    string BabyName,
    string Token
);

public record CreateInviteDto(
    [Required, EmailAddress, MaxLength(255)] string Email,
    [Required] string Role,
    [Required] Guid BabyId
);

public record AcceptInviteDto(
    [Required, MaxLength(64)] string Token
);

public record UpdateCaregiverRoleDto(
    [Required] string Role
);
