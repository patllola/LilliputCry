using System.ComponentModel.DataAnnotations;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Pump.Models;

public sealed class PumpSession
{
    [Key]
    public int Id { get; set; }
    public Guid GuidId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime PumpedAt { get; set; }
    public decimal LeftAmount { get; set; }
    public decimal RightAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
