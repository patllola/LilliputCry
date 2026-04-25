using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Sleep.Model;

public class SleepingLog
{
    [Key]
    public int Id { get; set; }
    
    public Guid GuidId { get; set; } = Guid.NewGuid();
    
    public DateTime SleepStart { get; set; }
    
    public DateTime SleepEnd { get; set; }
    
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}