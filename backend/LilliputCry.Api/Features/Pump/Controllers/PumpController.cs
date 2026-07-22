using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Pump.DTOs;
using TinyTrack.Api.Features.Pump.Services;
using TinyTrack.Api.Filters;

namespace TinyTrack.Api.Features.Pump.Controllers;

[ApiController]
[Route("api/pump-sessions")]
[Tags("PumpSessions")]
[Authorize]
[RequireActiveSubscription]
public class PumpController(PumpSessionService pumpSessionService, BabyService babyService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<PumpSessionResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(Guid? babyId = null, int page = 1, int pageSize = 50)
    {
        var (babyIntId, error) = await babyService.ResolveBabyIdAsync(babyId, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        var sessions = await pumpSessionService.GetAllAsync(
            CurrentUserId,
            babyIntId,
            page < 1 ? 1 : page,
            pageSize < 1 || pageSize > 100 ? 50 : pageSize);
        return Ok(sessions);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PumpSessionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await pumpSessionService.GetByIdAsync(id, CurrentUserId);
        return session == null ? NotFound() : Ok(session);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PumpSessionResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreatePumpSessionDto input)
    {
        var (dto, error) = await pumpSessionService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(PumpSessionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdatePumpSessionDto input)
    {
        var (dto, notFound, error) = await pumpSessionService.UpdateAsync(id, input, CurrentUserId);
        if (notFound is not null) return NotFound();
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await pumpSessionService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
