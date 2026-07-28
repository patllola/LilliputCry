using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Caregivers.Models;

public enum CaregiverInviteStatus
{
    Pending,
    Accepted,
    Cancelled
}

/// <summary>
/// A pending offer of <see cref="Role"/> access to <see cref="BabyId"/>, addressed to an
/// email that may not have an account yet. Accepting converts it into a
/// <see cref="CaregiverAccess"/> row.
/// </summary>
public sealed class CaregiverInvite
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();

    public int BabyId { get; set; }
    public Baby Baby { get; set; } = null!;

    public int InvitedByUserId { get; set; }
    public User InvitedBy { get; set; } = null!;

    /// Stored lowercased so lookups on accept are case-insensitive.
    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public CaregiverRole Role { get; set; } = CaregiverRole.Log;

    /// Opaque single-use secret handed to the invitee out of band (email/share sheet).
    [Required, MaxLength(64)]
    public string Token { get; set; } = string.Empty;

    public CaregiverInviteStatus Status { get; set; } = CaregiverInviteStatus.Pending;

    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public int? AcceptedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
