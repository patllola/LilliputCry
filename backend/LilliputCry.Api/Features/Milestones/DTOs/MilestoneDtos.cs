using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Milestones.DTOs;

public class CreateMilestoneDto
{
    [Required]
    public DateTime AchievedAt { get; set; }

    [Required, MaxLength(500)]
    public string Note { get; set; } = string.Empty;

    [Required]
    public IFormFile Image { get; set; } = null!;

    public Guid? BabyId { get; set; }
}

public class UpdateMilestoneDto
{
    public DateTime? AchievedAt { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public IFormFile? Image { get; set; }

    public Guid? BabyId { get; set; }
}

public record MilestoneResponseDto(
    int Id,
    Guid GuidId,
    Guid? BabyId,
    DateTime AchievedAt,
    string Note,
    string ImageUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
