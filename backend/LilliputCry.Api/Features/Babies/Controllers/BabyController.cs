using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Babies.DTOs;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Filters;

namespace TinyTrack.Api.Features.Babies.Controllers;

[ApiController]
[Route("api/babies")]
[Tags("Babies")]
[Authorize]
[RequireActiveSubscription]
public class BabyController(BabyService babyService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<BabyResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var babies = await babyService.GetAllAsync(CurrentUserId);
        return Ok(babies);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BabyResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var baby = await babyService.GetByIdAsync(id, CurrentUserId);
        return baby == null ? NotFound() : Ok(baby);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BabyResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateBabyDto input)
    {
        var (dto, error) = await babyService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BabyResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateBabyDto input)
    {
        var (dto, notFound, error) = await babyService.UpdateAsync(id, input, CurrentUserId);
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
        var success = await babyService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
