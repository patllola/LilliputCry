using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Services;
using Xunit;

namespace LilliputCry.Api.Tests.Users;

public class UserServiceTests
{
    private static UpdateUserProfileDto Profile(
        string name = "Updated Name",
        string email = "owner@example.com",
        string? phone = null) =>
        new(name, email, null, phone, null, null, null, null, null);

    [Fact]
    public async Task GetProfile_includes_the_plan_fields_the_app_reads()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, billing: BillingCycle.Yearly);

        var dto = await new UserService(h.Db).GetProfileAsync(user.GuidId);

        Assert.Equal("family", dto!.PlanTier);
        Assert.Equal("yearly", dto.BillingCycle);
    }

    [Fact]
    public async Task GetProfile_returns_null_for_an_unknown_guid()
    {
        using var h = new TestDb();

        Assert.Null(await new UserService(h.Db).GetProfileAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateProfile_saves_the_changed_fields()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser("owner@example.com", "Old Name");

        var (dto, error) = await new UserService(h.Db)
            .UpdateProfileAsync(user.GuidId, Profile("New Name", "owner@example.com", "+15550000"));

        Assert.Null(error);
        Assert.Equal("New Name", dto!.FullName);
        Assert.Equal("+15550000", dto.PhoneNumber);
    }

    [Fact]
    public async Task UpdateProfile_refuses_an_email_another_account_already_uses()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser("owner@example.com");
        h.Db.AddUser("taken@example.com");

        var (dto, error) = await new UserService(h.Db)
            .UpdateProfileAsync(user.GuidId, Profile(email: "taken@example.com"));

        Assert.Null(dto);
        Assert.Equal("email_already_exists", error);
    }

    [Fact]
    public async Task UpdateProfile_lets_a_user_keep_their_own_email()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser("owner@example.com");

        var (dto, error) = await new UserService(h.Db)
            .UpdateProfileAsync(user.GuidId, Profile(email: "owner@example.com"));

        Assert.Null(error);
        Assert.NotNull(dto);
    }

    [Fact]
    public async Task UpdateProfile_reports_not_found_for_an_unknown_guid()
    {
        using var h = new TestDb();

        var (dto, error) = await new UserService(h.Db).UpdateProfileAsync(Guid.NewGuid(), Profile());

        Assert.Null(dto);
        Assert.Equal("not_found", error);
    }

    [Fact]
    public async Task UpdateProfile_does_not_change_the_plan()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family, billing: BillingCycle.Yearly);

        var (dto, _) = await new UserService(h.Db).UpdateProfileAsync(user.GuidId, Profile());

        // Plan changes belong to /api/subscription/select, not the profile form.
        Assert.Equal("family", dto!.PlanTier);
        Assert.Equal("yearly", dto.BillingCycle);
    }
}
