using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Medications.DTOs;
using TinyTrack.Api.Features.Medications.Services;

namespace TinyTrack.Api.Features.Medications.Controllers;

[ApiController]
[Route("api/medications")]
[Tags("Medications")]
[Authorize]
public class MedicationController(MedicationService medicationService, BabyService babyService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType(typeof(List<MedicationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(Guid? babyId = null)
    {
        var (babyIntId, error) = await babyService.ResolveBabyIdAsync(babyId, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        var medications = await medicationService.GetAllAsync(CurrentUserId, babyIntId);
        return Ok(medications);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var medication = await medicationService.GetByIdAsync(id, CurrentUserId);
        return medication == null ? NotFound() : Ok(medication);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateMedicationDto input)
    {
        var (dto, error) = await medicationService.CreateAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return CreatedAtAction(nameof(GetById), new { id = dto!.GuidId }, dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateMedicationDto input)
    {
        var (dto, notFound, error) = await medicationService.UpdateAsync(id, input, CurrentUserId);
        if (notFound is not null) return NotFound();
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(dto);
    }

    [HttpPatch("{id:guid}/toggle-done")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleDone(Guid id)
    {
        var (dto, notFound) = await medicationService.ToggleDoneAsync(id, CurrentUserId);
        return notFound is not null ? NotFound() : Ok(dto);
    }

    [HttpPatch("{id:guid}/toggle-reminder")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleReminder(Guid id)
    {
        var (dto, notFound) = await medicationService.ToggleReminderAsync(id, CurrentUserId);
        return notFound is not null ? NotFound() : Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await medicationService.DeleteAsync(id, CurrentUserId);
        return success ? NoContent() : NotFound();
    }
}
