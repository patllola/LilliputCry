using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Pump.DTOs;

public record CreatePumpSessionDto(
    [Required] DateTime PumpedAt,
    [Required, Range(0, 10000)] decimal LeftAmount,
    [Required, Range(0, 10000)] decimal RightAmount,
    string? Notes,
    Guid? BabyId
);

public record UpdatePumpSessionDto(
    DateTime? PumpedAt,
    [Range(0, 10000)] decimal? LeftAmount,
    [Range(0, 10000)] decimal? RightAmount,
    string? Notes,
    Guid? BabyId
);

public record PumpSessionResponseDto(
    int Id,
    Guid GuidId,
    Guid? BabyId,
    DateTime PumpedAt,
    decimal LeftAmount,
    decimal RightAmount,
    decimal TotalAmount,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
