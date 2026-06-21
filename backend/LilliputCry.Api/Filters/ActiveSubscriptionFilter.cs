using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireActiveSubscriptionAttribute : Attribute, IFilterFactory
{
    public bool IsReusable => false;
    public IFilterMetadata CreateInstance(IServiceProvider services) =>
        new ActiveSubscriptionFilter(services.GetRequiredService<AppDbContext>());
}

public sealed class ActiveSubscriptionFilter(AppDbContext db) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Admins always pass through
        if (context.HttpContext.User.IsInRole(UserRole.Admin.ToString()))
        {
            await next();
            return;
        }

        var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var user = await db.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.SubscriptionStatus, u.TrialEndsAt, u.SubscriptionExpiresAt })
            .FirstOrDefaultAsync();

        if (user == null) { context.Result = new UnauthorizedResult(); return; }

        var now = DateTime.UtcNow;
        var hasAccess = user.SubscriptionStatus switch
        {
            SubscriptionStatus.Trial  => user.TrialEndsAt.HasValue && user.TrialEndsAt.Value > now,
            SubscriptionStatus.Active => user.SubscriptionExpiresAt.HasValue && user.SubscriptionExpiresAt.Value > now,
            _                         => false
        };

        if (!hasAccess)
        {
            context.Result = new ObjectResult(new
            {
                error = "subscription_required",
                message = "Your free trial has ended. Subscribe for $10/month to continue.",
                trialEndsAt = user.TrialEndsAt,
                subscriptionExpiresAt = user.SubscriptionExpiresAt
            })
            { StatusCode = StatusCodes.Status402PaymentRequired };
            return;
        }

        await next();
    }
}
