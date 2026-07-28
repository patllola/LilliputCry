using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Caregivers.DTOs;
using TinyTrack.Api.Features.Caregivers.Services;

namespace TinyTrack.Api.Features.Caregivers.Controllers;

[ApiController]
[Route("api/caregivers")]
[Tags("Caregivers")]
[Authorize]
public class CaregiverController(CaregiverService caregiverService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Everyone with access to a baby, owner first.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CaregiverResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCaregivers([FromQuery] Guid babyId)
    {
        var (list, error) = await caregiverService.GetCaregiversAsync(babyId, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(list);
    }

    /// <summary>Outstanding invites the caller issued. Omit babyId to span all their babies.</summary>
    [HttpGet("invites")]
    [ProducesResponseType(typeof(List<PendingInviteResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPendingInvites([FromQuery] Guid? babyId = null)
    {
        var (list, error) = await caregiverService.GetPendingInvitesAsync(babyId, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(list);
    }

    /// <summary>
    /// Invites addressed to the caller's own email. Someone being invited onto a Family
    /// plan is typically on Free themselves — seats are charged to the inviter's plan.
    /// </summary>
    [HttpGet("invites/mine")]
    [ProducesResponseType(typeof(List<PendingInviteResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvitesForMe() =>
        Ok(await caregiverService.GetInvitesForMeAsync(CurrentUserId));

    [HttpPost("invites")]
    [ProducesResponseType(typeof(CreatedInviteResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateInvite(CreateInviteDto input)
    {
        var (dto, error) = await caregiverService.CreateInviteAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetPendingInvites), new { babyId = dto!.BabyId }, dto);
    }

    /// <summary>Redeems an invite token for the signed-in account.</summary>
    [HttpPost("invites/accept")]
    [ProducesResponseType(typeof(CaregiverResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptInvite(AcceptInviteDto input)
    {
        var (dto, error) = await caregiverService.AcceptInviteAsync(input.Token, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(dto);
    }

    [HttpDelete("invites/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelInvite(Guid id)
    {
        var (ok, _) = await caregiverService.CancelInviteAsync(id, CurrentUserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(CaregiverResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRole(Guid id, UpdateCaregiverRoleDto input)
    {
        var (dto, notFound, error) = await caregiverService.UpdateRoleAsync(id, input.Role, CurrentUserId);
        if (notFound is not null) return NotFound();
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(dto);
    }

    /// <summary>Revokes a grant. Also used by a caregiver to remove themselves.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCaregiver(Guid id)
    {
        var (ok, _) = await caregiverService.RemoveCaregiverAsync(id, CurrentUserId);
        return ok ? NoContent() : NotFound();
    }
}
