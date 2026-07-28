using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Caregivers.Models;

/// <summary>
/// A standing grant letting a user other than the baby's creator see and/or log
/// against that baby. The creator's own access is implicit via <see cref="Baby.UserId"/>
/// and is never stored here.
/// </summary>
public sealed class CaregiverAccess
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();

    public int BabyId { get; set; }
    public Baby Baby { get; set; } = null!;

    /// The caregiver the grant belongs to.
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// Who issued the grant (the owner, or a Full-access caregiver).
    public int GrantedByUserId { get; set; }

    public CaregiverRole Role { get; set; } = CaregiverRole.Log;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
