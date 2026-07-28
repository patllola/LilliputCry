using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Subscriptions;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Subscriptions.Services;
using TinyTrack.Api.Features.Users.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Subscriptions;

public class PlanLimitServiceTests
{
    [Fact]
    public async Task A_new_user_is_on_free_with_no_expiry()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(user.Id);

        Assert.Equal(PlanTier.Free, entitlement.Tier);
        Assert.False(entitlement.HasPaidAccess);
        Assert.Null(user.PlanExpiresAt);
    }

    [Fact]
    public async Task A_paid_plan_with_time_left_grants_its_tier()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddMonths(1));

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(user.Id);

        Assert.Equal(PlanTier.Family, entitlement.Tier);
        Assert.True(entitlement.HasPaidAccess);
        Assert.Equal(4, entitlement.Plan.CaregiverSeats);
    }

    [Fact]
    public async Task A_lapsed_paid_plan_falls_back_to_free_rather_than_locking_out()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddDays(-1));

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(user.Id);

        Assert.Equal(PlanTier.Free, entitlement.Tier);
        Assert.False(entitlement.HasPaidAccess);
    }

    [Fact]
    public async Task Choosing_a_paid_tier_without_paying_grants_nothing()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Plus, paidUp: false);

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(user.Id);

        Assert.Equal(PlanTier.Free, entitlement.Tier);
    }

    [Fact]
    public async Task An_admin_is_never_limited()
    {
        using var h = new TestDb();
        var admin = h.Db.AddUser(role: UserRole.Admin, plan: PlanTier.Free);

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(admin.Id);

        Assert.Equal(PlanTier.Family, entitlement.Tier);
        Assert.Null(entitlement.Plan.MaxBabies);
    }

    [Fact]
    public async Task An_unknown_user_gets_the_free_tier_rather_than_throwing()
    {
        using var h = new TestDb();

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(9999);

        Assert.Equal(PlanTier.Free, entitlement.Tier);
    }

    [Theory]
    [InlineData(PlanTier.Free, null, PlanTier.Free)]
    [InlineData(PlanTier.Plus, null, PlanTier.Free)]
    [InlineData(PlanTier.Plus, -1, PlanTier.Free)]
    [InlineData(PlanTier.Plus, 30, PlanTier.Plus)]
    [InlineData(PlanTier.Family, 30, PlanTier.Family)]
    public void Resolve_covers_every_tier_and_expiry_combination(
        PlanTier stored, int? expiresInDays, PlanTier expected)
    {
        var expiry = expiresInDays.HasValue ? DateTime.UtcNow.AddDays(expiresInDays.Value) : (DateTime?)null;

        var entitlement = PlanLimitService.Resolve(stored, expiry);

        Assert.Equal(expected, entitlement.Tier);
    }

    [Fact]
    public async Task History_cutoff_is_seven_days_on_free_and_absent_on_paid_tiers()
    {
        using var h = new TestDb();
        var free = h.Db.AddUser("free@example.com", plan: PlanTier.Free);
        var plus = h.Db.AddUser("plus@example.com", plan: PlanTier.Plus);
        var service = Services.PlanLimits(h.Db);

        var freeCutoff = await service.GetHistoryCutoffAsync(free.Id);
        Assert.NotNull(freeCutoff);
        Assert.InRange((DateTime.UtcNow - freeCutoff!.Value).TotalDays, 6.9, 7.1);

        Assert.Null(await service.GetHistoryCutoffAsync(plus.Id));
    }

    [Fact]
    public void Catalog_prices_and_limits_match_what_the_app_advertises()
    {
        Assert.Equal(0m, PlanCatalog.Free.Monthly);
        Assert.Equal(1, PlanCatalog.Free.MaxBabies);
        Assert.Equal(7, PlanCatalog.Free.HistoryDays);
        Assert.Equal(0, PlanCatalog.Free.CaregiverSeats);

        Assert.Equal(4.99m, PlanCatalog.Plus.Monthly);
        Assert.Equal(47.90m, PlanCatalog.Plus.Yearly);
        Assert.Equal(3, PlanCatalog.Plus.MaxBabies);
        Assert.Null(PlanCatalog.Plus.HistoryDays);

        Assert.Equal(8.99m, PlanCatalog.Family.Monthly);
        Assert.Equal(86.30m, PlanCatalog.Family.Yearly);
        Assert.Null(PlanCatalog.Family.MaxBabies);
        Assert.Equal(4, PlanCatalog.Family.CaregiverSeats);
    }

    [Fact]
    public void PriceFor_picks_the_right_column_per_billing_cycle()
    {
        Assert.Equal(4.99m, PlanCatalog.PriceFor(PlanTier.Plus, BillingCycle.Monthly));
        Assert.Equal(47.90m, PlanCatalog.PriceFor(PlanTier.Plus, BillingCycle.Yearly));
        Assert.Equal(0m, PlanCatalog.PriceFor(PlanTier.Free, BillingCycle.Yearly));
    }
}
