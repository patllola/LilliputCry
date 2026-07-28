using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TinyTrack.Api.Features.Subscriptions.DTOs;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace TinyTrack.Api.Features.Subscriptions.Controllers;

/// <summary>
/// Plan catalogue and the caller's own plan. Nothing here is gated: a user on Free, or
/// one whose paid plan has lapsed, must still be able to read the plans and pick one.
/// </summary>
[ApiController]
[Route("api/subscription")]
[Tags("Subscription")]
[Authorize]
public class SubscriptionController(SubscriptionService subscriptionService) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("plans")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<PlanResponseDto>), StatusCodes.Status200OK)]
    public IActionResult GetPlans() => Ok(SubscriptionService.GetPlans());

    [HttpGet("me")]
    [ProducesResponseType(typeof(MySubscriptionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMine()
    {
        var dto = await subscriptionService.GetMineAsync(CurrentUserId);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>
    /// Records the caller's plan choice. Responds 200 with <c>requiresPayment: true</c>
    /// when a paid tier was chosen but isn't active yet — no money moves here.
    /// </summary>
    [HttpPost("select")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SelectPlan(SelectPlanDto input)
    {
        var (dto, requiresPayment, error) = await subscriptionService.SelectPlanAsync(input, CurrentUserId);
        if (error is not null)
        {
            ModelState.AddModelError(error.Field, error.Message);
            return ValidationProblem();
        }
        return Ok(new { subscription = dto, requiresPayment });
    }
}
