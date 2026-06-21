using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Sleep.DTOs;
using TinyTrack.Api.Features.Sleep.Services;
using TinyTrack.Api.Filters;

namespace TinyTrack.Api.Features.Sleep.Controllers;

[ApiController]
[Route("api/sleep-logs")]
[Tags("SleepLogs")]
[Authorize]
[RequireActiveSubscription]
public class SleepController(SleepLogService sleepLogService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<SleepLogResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 50)
    {
        var logs = await sleepLogService.GetAllAsync(
            CurrentUserId,
            page < 1 ? 1 : page,
            pageSize < 1 || pageSize > 100 ? 50 : pageSize);
        return Ok(logs);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SleepLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var log = await sleepLogService.GetByIdAsync(id, CurrentUserId);
        return log == null ? NotFound() : Ok(log);
    }

    [HttpPost]
    [ProducesResponseType(typeof(SleepLogResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateSleepLogDto input)
    {
        var (dto, error) = await sleepLogService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SleepLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateSleepLogDto input)
    {
        var (dto, notFound, error) = await sleepLogService.UpdateAsync(id, input, CurrentUserId);
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
        var success = await sleepLogService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
