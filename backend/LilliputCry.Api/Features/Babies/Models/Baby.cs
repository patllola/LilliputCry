using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Babies.Models;

public sealed class Baby
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
