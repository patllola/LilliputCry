using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Admin.DTOs;
using TinyTrack.Api.Features.Admin.Services;

namespace TinyTrack.Api.Features.Admin.Controllers;

[ApiController]
[Route("api/admin")]
[Tags("Admin")]
[Authorize(Roles = "Admin")]
public class AdminController(AdminService adminService) : ControllerBase
{
    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats() =>
        Ok(await adminService.GetStatsAsync());

    [HttpGet("users")]
    [ProducesResponseType(typeof(List<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(int page = 1, int pageSize = 50)
    {
        var users = await adminService.GetUsersAsync(
            page < 1 ? 1 : page,
            pageSize < 1 || pageSize > 200 ? 50 : pageSize);
        return Ok(users);
    }

    [HttpPatch("users/{userGuid:guid}/activate")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateSubscription(Guid userGuid, ActivateSubscriptionDto input)
    {
        var (dto, error) = await adminService.ActivateSubscriptionAsync(userGuid, input.Months);
        if (error == "not_found") return NotFound();
        if (error is not null)
        {
            ModelState.AddModelError("error", error);
            return ValidationProblem();
        }
        return Ok(dto);
    }

    [HttpPatch("users/{userGuid:guid}/revoke")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSubscription(Guid userGuid)
    {
        var (dto, error) = await adminService.RevokeSubscriptionAsync(userGuid);
        if (error == "not_found") return NotFound();
        if (error is not null)
        {
            ModelState.AddModelError("error", error);
            return ValidationProblem();
        }
        return Ok(dto);
    }
}
