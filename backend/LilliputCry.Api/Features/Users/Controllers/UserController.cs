using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Services;

namespace TinyTrack.Api.Features.Users.Controllers;

[ApiController]
[Route("api/users")]
[Tags("Users")]
public class UserController(UserService userService) : ControllerBase
{
    // For now, let's assume a static GUID for the current user profile
    // In a real app, this would come from the JWT token/Auth
    private static readonly Guid CurrentUserGuidId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet("GetMyProfile")]
    [ProducesResponseType(typeof(UserProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        var profile = await userService.GetProfileAsync(CurrentUserGuidId);
        return profile == null ? NotFound() : Ok(profile);
    }

    [HttpPatch("UpdateMyProfile")]
    [ProducesResponseType(typeof(UserProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile(UpdateUserProfileDto input)
    {
        var (dto, error) = await userService.UpdateProfileAsync(CurrentUserGuidId, input);
        if (error == "not_found") return NotFound();
        if (error != null) return BadRequest(new { error });
        
        return Ok(dto);
    }
}
