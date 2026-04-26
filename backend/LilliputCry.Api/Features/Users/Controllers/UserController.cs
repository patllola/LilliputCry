using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Services;

namespace TinyTrack.Api.Features.Users.Controllers;

[ApiController]
[Route("api/users")]
[Tags("Users")]
[Authorize]
public class UserController(UserService userService) : ControllerBase
{
    private Guid CurrentUserGuidId =>
        Guid.Parse(User.FindFirstValue("guid")!);

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
