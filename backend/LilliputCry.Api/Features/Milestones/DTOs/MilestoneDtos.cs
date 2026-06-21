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
}

public class UpdateMilestoneDto
{
    public DateTime? AchievedAt { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public IFormFile? Image { get; set; }
}

// Returned in list — no image bytes
public record MilestoneListDto(
    int Id,
    Guid GuidId,
    DateTime AchievedAt,
    string Note,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// Returned in single GET — includes base64 image
public record MilestoneDetailDto(
    int Id,
    Guid GuidId,
    DateTime AchievedAt,
    string Note,
    string ImageDataUri,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
