using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Admin.DTOs;
using TinyTrack.Api.Features.Admin.Services;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Users.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Admin;

public class AdminServiceTests
{
    [Fact]
    public async Task Stats_bucket_users_by_effective_tier()
    {
        using var h = new TestDb();
        h.Db.AddUser("free@example.com", plan: PlanTier.Free);
        h.Db.AddUser("plus@example.com", plan: PlanTier.Plus);
        h.Db.AddUser("family@example.com", plan: PlanTier.Family);
        h.Db.AddUser("admin@example.com", role: UserRole.Admin);

        var stats = await new AdminService(h.Db).GetStatsAsync();

        Assert.Equal(3, stats.TotalUsers);   // admins excluded
        Assert.Equal(1, stats.FreeUsers);
        Assert.Equal(1, stats.PlusUsers);
        Assert.Equal(1, stats.FamilyUsers);
        Assert.Equal(1, stats.AdminUsers);
    }

    [Fact]
    public async Task A_lapsed_paid_user_counts_as_free_and_as_lapsed()
    {
        using var h = new TestDb();
        h.Db.AddUser("lapsed@example.com", plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddDays(-1));

        var stats = await new AdminService(h.Db).GetStatsAsync();

        Assert.Equal(1, stats.FreeUsers);
        Assert.Equal(0, stats.FamilyUsers);
        Assert.Equal(1, stats.LapsedUsers);
    }

    [Fact]
    public async Task Revenue_sums_actual_tier_prices_rather_than_a_flat_rate()
    {
        using var h = new TestDb();
        h.Db.AddUser("plus@example.com", plan: PlanTier.Plus);       // 4.99
        h.Db.AddUser("family@example.com", plan: PlanTier.Family);   // 8.99
        h.Db.AddUser("free@example.com", plan: PlanTier.Free);       // 0

        var stats = await new AdminService(h.Db).GetStatsAsync();

        Assert.Equal(13.98m, stats.EstimatedMonthlyRevenue);
    }

    [Fact]
    public async Task Yearly_billing_is_spread_across_twelve_months()
    {
        using var h = new TestDb();
        h.Db.AddUser("yearly@example.com", plan: PlanTier.Plus, billing: BillingCycle.Yearly);

        var stats = await new AdminService(h.Db).GetStatsAsync();

        // 47.90 / 12, rounded to cents — not the 4.99 monthly price.
        Assert.Equal(3.99m, stats.EstimatedMonthlyRevenue);
    }

    [Fact]
    public async Task Lapsed_users_contribute_no_revenue()
    {
        using var h = new TestDb();
        h.Db.AddUser("lapsed@example.com", plan: PlanTier.Family, planExpiresAt: DateTime.UtcNow.AddDays(-1));

        var stats = await new AdminService(h.Db).GetStatsAsync();

        Assert.Equal(0m, stats.EstimatedMonthlyRevenue);
    }

    [Fact]
    public async Task GrantPlan_sets_the_tier_and_an_expiry()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);

        var (dto, error) = await new AdminService(h.Db)
            .GrantPlanAsync(user.GuidId, new GrantPlanDto(3, "family"));

        Assert.Null(error);
        Assert.Equal("family", dto!.PlanTier);
        Assert.Equal("family", dto.EffectivePlanTier);
        Assert.True(dto.HasPaidAccess);
        Assert.InRange(dto.PlanExpiresAt!.Value, DateTime.UtcNow.AddMonths(3).AddMinutes(-5), DateTime.UtcNow.AddMonths(3).AddMinutes(5));
    }

    [Fact]
    public async Task GrantPlan_without_a_tier_starts_a_free_user_on_plus()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);

        var (dto, error) = await new AdminService(h.Db).GrantPlanAsync(user.GuidId, new GrantPlanDto(1));

        Assert.Null(error);
        Assert.Equal("plus", dto!.PlanTier);
    }

    [Fact]
    public async Task GrantPlan_extends_a_live_plan_from_its_existing_expiry()
    {
        using var h = new TestDb();
        var expiry = DateTime.UtcNow.AddMonths(2);
        var user = h.Db.AddUser(plan: PlanTier.Plus, planExpiresAt: expiry);

        var (dto, _) = await new AdminService(h.Db).GrantPlanAsync(user.GuidId, new GrantPlanDto(1));

        // Topping up must not shorten the time they already had.
        Assert.InRange(dto!.PlanExpiresAt!.Value, expiry.AddMonths(1).AddMinutes(-5), expiry.AddMonths(1).AddMinutes(5));
    }

    [Fact]
    public async Task GrantPlan_restarts_from_now_when_the_plan_already_lapsed()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Plus, planExpiresAt: DateTime.UtcNow.AddMonths(-3));

        var (dto, _) = await new AdminService(h.Db).GrantPlanAsync(user.GuidId, new GrantPlanDto(1));

        Assert.True(dto!.PlanExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task GrantPlan_refuses_free_and_points_at_revoke()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Plus);

        var (dto, error) = await new AdminService(h.Db)
            .GrantPlanAsync(user.GuidId, new GrantPlanDto(1, "free"));

        Assert.Null(dto);
        Assert.Equal("use_revoke_to_move_a_user_to_free", error);
    }

    [Fact]
    public async Task GrantPlan_rejects_an_unknown_tier()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await new AdminService(h.Db)
            .GrantPlanAsync(user.GuidId, new GrantPlanDto(1, "platinum"));

        Assert.Null(dto);
        Assert.Equal("invalid_plan_tier", error);
    }

    [Fact]
    public async Task GrantPlan_refuses_to_touch_an_admin()
    {
        using var h = new TestDb();
        var admin = h.Db.AddUser(role: UserRole.Admin);

        var (dto, error) = await new AdminService(h.Db).GrantPlanAsync(admin.GuidId, new GrantPlanDto(1));

        Assert.Null(dto);
        Assert.Equal("cannot_set_plan_for_admin", error);
    }

    [Fact]
    public async Task GrantPlan_reports_not_found_for_an_unknown_user()
    {
        using var h = new TestDb();

        var (dto, error) = await new AdminService(h.Db).GrantPlanAsync(Guid.NewGuid(), new GrantPlanDto(1));

        Assert.Null(dto);
        Assert.Equal("not_found", error);
    }

    [Fact]
    public async Task RevokePlan_drops_the_user_to_free_and_clears_the_expiry()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family);

        var (dto, error) = await new AdminService(h.Db).RevokePlanAsync(user.GuidId);

        Assert.Null(error);
        Assert.Equal("free", dto!.PlanTier);
        Assert.Null(dto.PlanExpiresAt);
        Assert.False(dto.HasPaidAccess);
    }

    [Fact]
    public async Task RevokePlan_refuses_to_touch_an_admin()
    {
        using var h = new TestDb();
        var admin = h.Db.AddUser(role: UserRole.Admin);

        var (dto, error) = await new AdminService(h.Db).RevokePlanAsync(admin.GuidId);

        Assert.Null(dto);
        Assert.Equal("cannot_revoke_admin", error);
    }

    [Fact]
    public async Task Revoking_a_family_plan_immediately_costs_the_caregiver_seats()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser(plan: PlanTier.Family);
        var baby = h.Db.AddBaby(owner.Id);

        await new AdminService(h.Db).RevokePlanAsync(owner.GuidId);

        var entitlement = await Services.PlanLimits(h.Db).GetEntitlementAsync(owner.Id);
        Assert.Equal(0, entitlement.Plan.CaregiverSeats);
    }

    [Fact]
    public async Task GetUsers_reports_an_admin_as_unlimited()
    {
        using var h = new TestDb();
        h.Db.AddUser("admin@example.com", role: UserRole.Admin, plan: PlanTier.Free);

        var users = await new AdminService(h.Db).GetUsersAsync();

        var admin = users.Single();
        Assert.Equal("free", admin.PlanTier);
        Assert.Equal("family", admin.EffectivePlanTier);
        Assert.True(admin.HasPaidAccess);
    }

    [Fact]
    public async Task GetUsers_returns_newest_first()
    {
        using var h = new TestDb();
        h.Db.AddUser("first@example.com");
        await Task.Delay(10);
        h.Db.AddUser("second@example.com");

        var users = await new AdminService(h.Db).GetUsersAsync();

        Assert.Equal("second@example.com", users[0].Email);
    }
}
