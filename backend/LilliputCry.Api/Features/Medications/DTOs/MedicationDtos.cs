using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Medications.DTOs;

public record CreateMedicationDto(
    [Required, MaxLength(200)] string Name,
    [MaxLength(50)] string? Dose,
    [Required, MaxLength(20)] string TimeOfDay,
    bool RepeatDaily,
    bool ReminderEnabled,
    Guid? BabyId
);

public record UpdateMedicationDto(
    [MaxLength(200)] string? Name,
    [MaxLength(50)] string? Dose,
    [MaxLength(20)] string? TimeOfDay,
    bool? RepeatDaily,
    bool? ReminderEnabled,
    Guid? BabyId
);

public record MedicationResponseDto(
    int Id,
    Guid GuidId,
    Guid? BabyId,
    string Name,
    string? Dose,
    string TimeOfDay,
    bool RepeatDaily,
    bool ReminderEnabled,
    bool IsDoneToday,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
