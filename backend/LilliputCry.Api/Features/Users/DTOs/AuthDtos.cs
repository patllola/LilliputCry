using System.ComponentModel.DataAnnotations;

namespace TinyTrack.Api.Features.Users.DTOs;

public record LoginRequestDto(
    [Required]
    [EmailAddress]
    string Email,

    [Required]
    string Password
);

public record RegisterRequestDto(
    [Required]
    [MaxLength(100)]
    string FullName,

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    string Email,

    [Required]
    [MinLength(6)]
    string Password,

    [MaxLength(20)]
    string? PhoneNumber = null
);

public record AuthResponseDto(
    UserProfileResponseDto User,
    string? Token = null
);
