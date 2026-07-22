using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Feeding.DTOs;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Filters;

namespace TinyTrack.Api.Features.Feeding.Controllers;

[ApiController]
[Route("api/feeding-logs")]
[Tags("FeedingLogs")]
[Authorize]
[RequireActiveSubscription]
public class FeedingController(FeedingLogService feedingLogService, BabyService babyService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<FeedingLogResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(Guid? babyId = null, int page = 1, int pageSize = 50)
    {
        var (babyIntId, error) = await babyService.ResolveBabyIdAsync(babyId, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        var logs = await feedingLogService.GetAllAsync(
            CurrentUserId,
            babyIntId,
            page < 1 ? 1 : page,
            pageSize < 1 || pageSize > 100 ? 50 : pageSize);
        return Ok(logs);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(FeedingLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var log = await feedingLogService.GetByIdAsync(id, CurrentUserId);
        return log == null ? NotFound() : Ok(log);
    }

    [HttpPost]
    [ProducesResponseType(typeof(FeedingLogResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateFeedingLogDto input)
    {
        var (dto, error) = await feedingLogService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(FeedingLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateFeedingLogDto input)
    {
        var (dto, notFound, error) = await feedingLogService.UpdateAsync(id, input, CurrentUserId);
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
        var success = await feedingLogService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
