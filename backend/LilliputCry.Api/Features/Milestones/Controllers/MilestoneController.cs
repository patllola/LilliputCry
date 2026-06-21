using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Milestones.DTOs;
using TinyTrack.Api.Features.Milestones.Services;
using TinyTrack.Api.Filters;

namespace TinyTrack.Api.Features.Milestones.Controllers;

[ApiController]
[Route("api/milestones")]
[Tags("Milestones")]
[Authorize]
[RequireActiveSubscription]
public class MilestoneController(MilestoneService milestoneService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<MilestoneResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 50)
    {
        var milestones = await milestoneService.GetAllAsync(
            CurrentUserId,
            page < 1 ? 1 : page,
            pageSize < 1 || pageSize > 100 ? 50 : pageSize);
        return Ok(milestones);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MilestoneResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var milestone = await milestoneService.GetByIdAsync(id, CurrentUserId);
        return milestone == null ? NotFound() : Ok(milestone);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MilestoneResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromForm] CreateMilestoneDto input)
    {
        var (dto, error) = await milestoneService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MilestoneResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateMilestoneDto input)
    {
        var (dto, notFound, error) = await milestoneService.UpdateAsync(id, input, CurrentUserId);
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
        var success = await milestoneService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
