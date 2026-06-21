using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Milestones.Models;

public sealed class Milestone
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime AchievedAt { get; set; }
    public string Note { get; set; } = string.Empty;
    public byte[] ImageData { get; set; } = [];
    public string ImageContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
