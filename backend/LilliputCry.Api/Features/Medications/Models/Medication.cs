using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Medications.Models;

public sealed class Medication
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? BabyId { get; set; }
    public Baby? Baby { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Dose { get; set; }
    public string TimeOfDay { get; set; } = string.Empty;
    public bool RepeatDaily { get; set; } = true;
    public bool ReminderEnabled { get; set; } = true;
    public bool IsDoneToday { get; set; }
    public DateOnly? LastToggledDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
