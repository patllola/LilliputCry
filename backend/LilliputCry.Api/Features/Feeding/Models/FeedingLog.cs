using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Feeding.Models;

public sealed class FeedingLog
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime FedAt { get; set; }
    public decimal MilkPrepared { get; set; }
    public decimal MilkFed { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
