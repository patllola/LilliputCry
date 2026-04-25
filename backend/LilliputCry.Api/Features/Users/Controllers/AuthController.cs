using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Services;

namespace TinyTrack.Api.Features.Users.Controllers;

[ApiController]
[Route("api/auth")]
[Tags("Auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequestDto input)
    {
        var (response, error) = await authService.RegisterAsync(input);
        if (error != null)
        {
            return BadRequest(new { error });
        }
        return Ok(response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequestDto input)
    {
        var (response, error) = await authService.LoginAsync(input);
        if (error != null)
        {
            return Unauthorized(new { error });
        }
        return Ok(response);
    }
}
