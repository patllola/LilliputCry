using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Subscriptions.Models;

namespace TinyTrack.Api.Features.Users.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    public Guid GuidId { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(255, MinimumLength = 6)]
    public string PasswordHash { get; set; } = string.Empty;

    [StringLength(600)]
    public string? ProfilePictureUrl { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; }

    [MaxLength(50)]
    public string? State { get; set; }

    [MaxLength(50)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    public UserRole Role { get; set; } = UserRole.User;
    /// <summary>
    /// The plan the user is on. Free is the default and never expires — there is no trial
    /// and no locked-out state, so this plus <see cref="PlanExpiresAt"/> is the whole
    /// subscription model.
    /// </summary>
    public PlanTier PlanTier { get; set; } = PlanTier.Free;

    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;

    /// When the user last chose a plan. Informational only.
    public DateTime? PlanSelectedAt { get; set; }

    /// <summary>
    /// When paid access lapses. Null on Free (nothing to expire) and on a paid tier that
    /// hasn't been paid for yet — in both cases the user is entitled to Free limits.
    /// </summary>
    public DateTime? PlanExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
