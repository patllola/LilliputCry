using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Sleep.DTOs;

public record CreateSleepLogDto(
    [Required] DateTime SleepStart,
    [Required] DateTime SleepEnd,
    bool IsNap = false,
    string? Notes = null,
    Guid? BabyId = null
);

public record UpdateSleepLogDto(
    DateTime? SleepStart,
    DateTime? SleepEnd,
    bool? IsNap,
    string? Notes,
    Guid? BabyId
);

public record SleepLogResponseDto(
    int Id,
    Guid GuidId,
    Guid? BabyId,
    DateTime SleepStart,
    DateTime SleepEnd,
    double DurationMinutes,
    bool IsNap,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
