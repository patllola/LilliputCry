using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Subscriptions.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Subscriptions.Services;
using TinyTrack.Api.Features.Users.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Subscriptions;

public class SubscriptionServiceTests
{
    [Fact]
    public void GetPlans_returns_the_three_tiers_in_display_order()
    {
        var plans = SubscriptionService.GetPlans();

        Assert.Equal(3, plans.Count);
        Assert.Equal(["free", "plus", "family"], plans.Select(p => p.Id));
        Assert.Equal("Popular", plans[1].Badge);
        Assert.Equal("Best value", plans[2].Badge);
    }

    [Fact]
    public async Task GetMine_separates_the_stored_choice_from_what_is_enforced()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddDays(-1));

        var dto = await Services.Subscriptions(h.Db).GetMineAsync(user.Id);

        Assert.Equal("family", dto!.PlanId);        // what they picked
        Assert.Equal("free", dto.EffectivePlanId);  // what a lapsed plan actually grants
        Assert.False(dto.HasPaidAccess);
    }

    [Fact]
    public async Task GetMine_reports_babies_and_caregiver_seats_in_use()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser(plan: PlanTier.Family);
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddBaby(owner.Id, "Second");
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "pending@example.com");

        var dto = await Services.Subscriptions(h.Db).GetMineAsync(owner.Id);

        Assert.Equal(2, dto!.BabiesUsed);
        // One accepted grant plus one outstanding invite both hold a seat.
        Assert.Equal(2, dto.CaregiverSeatsUsed);
        Assert.Equal(4, dto.CaregiverSeats);
    }

    [Fact]
    public async Task GetMine_returns_null_for_an_unknown_user()
    {
        using var h = new TestDb();

        Assert.Null(await Services.Subscriptions(h.Db).GetMineAsync(9999));
    }

    [Fact]
    public async Task SelectPlan_records_the_choice()
    {
        using var h = new TestDb();
        // Already paid up, so switching billing cycle doesn't send them back to checkout.
        var user = h.Db.AddUser(plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddMonths(6));

        var (dto, requiresPayment, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto("family", "yearly"), user.Id);

        Assert.Null(error);
        Assert.Equal("family", dto!.PlanId);
        Assert.Equal("yearly", dto.Billing);
        Assert.NotNull(dto.PlanSelectedAt);
        Assert.False(requiresPayment);
    }

    [Fact]
    public async Task Selecting_a_paid_plan_without_paying_asks_for_payment()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);

        var (dto, requiresPayment, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto("family", "monthly"), user.Id);

        Assert.Null(error);
        Assert.True(requiresPayment);
        Assert.Equal("family", dto!.PlanId);
        // Choosing it doesn't grant it — enforcement still sees Free.
        Assert.Equal("free", dto.EffectivePlanId);
    }

    [Fact]
    public async Task Staying_on_free_never_requires_payment()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddDays(-1));

        var (dto, requiresPayment, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto("free", "monthly"), user.Id);

        Assert.Null(error);
        Assert.False(requiresPayment);
        Assert.Equal("free", dto!.PlanId);
    }

    [Theory]
    [InlineData("FREE", "MONTHLY")]
    [InlineData(" plus ", " yearly ")]
    public async Task SelectPlan_is_forgiving_about_casing_and_padding(string plan, string billing)
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (_, _, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto(plan, billing), user.Id);

        Assert.Null(error);
    }

    [Fact]
    public async Task SelectPlan_rejects_an_unknown_tier()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, _, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto("platinum", "monthly"), user.Id);

        Assert.Null(dto);
        Assert.Equal("planId", error!.Field);
    }

    [Fact]
    public async Task SelectPlan_rejects_an_unknown_billing_cycle()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, _, error) = await Services.Subscriptions(h.Db)
            .SelectPlanAsync(new SelectPlanDto("plus", "weekly"), user.Id);

        Assert.Null(dto);
        Assert.Equal("billing", error!.Field);
    }

    [Fact]
    public async Task Downgrading_to_free_immediately_tightens_the_limits()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family);
        h.Db.AddBaby(user.Id, "First");

        await Services.Subscriptions(h.Db).SelectPlanAsync(new SelectPlanDto("free", "monthly"), user.Id);

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(user.Id);
        Assert.Equal(1, entitlement.Plan.MaxBabies);
    }
}
