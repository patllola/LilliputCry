using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Babies.DTOs;

public record CreateBabyDto(
    [Required, MaxLength(100)] string Name,
    [Required, MaxLength(10)] string AvatarColor,
    [Required] DateTime DateOfBirth,
    [Range(0.1, 200)] decimal? WeightKg,
    [Range(1, 250)] decimal? HeightCm
);

public record UpdateBabyDto(
    [MaxLength(100)] string? Name,
    [MaxLength(10)] string? AvatarColor,
    DateTime? DateOfBirth,
    [Range(0.1, 200)] decimal? WeightKg,
    [Range(1, 250)] decimal? HeightCm
);

public record BabyResponseDto(
    int Id,
    Guid GuidId,
    string Name,
    string AvatarColor,
    DateTime DateOfBirth,
    decimal? WeightKg,
    decimal? HeightCm,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    /// The caller's own role on this baby: "owner" | "full" | "log" | "read".
    /// Lets the client hide edit/invite affordances a caregiver isn't allowed to use.
    string MyRole
);
