using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Babies.DTOs;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Babies;

public class BabyServiceTests
{
    private static CreateBabyDto NewBaby(string name = "Ava") =>
        new(name, "#ff6fa5", DateTime.UtcNow.AddMonths(-3), null, null);

    [Fact]
    public async Task GetAll_returns_owned_babies_first_then_shared_ones()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        h.Db.AddBaby(helper.Id, "Own");
        var shared = h.Db.AddBaby(owner.Id, "Shared");
        h.Db.GrantAccess(shared.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var list = await Services.Babies(h.Db).GetAllAsync(helper.Id);

        Assert.Equal(2, list.Count);
        Assert.Equal("Own", list[0].Name);
        Assert.Equal("owner", list[0].MyRole);
        Assert.Equal("Shared", list[1].Name);
        Assert.Equal("log", list[1].MyRole);
    }

    [Fact]
    public async Task GetAll_excludes_babies_that_were_never_shared()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        h.Db.AddBaby(owner.Id);

        Assert.Empty(await Services.Babies(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task GetById_returns_null_for_a_baby_the_caller_cannot_see()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        Assert.Null(await Services.Babies(h.Db).GetByIdAsync(baby.GuidId, stranger.Id));
        Assert.NotNull(await Services.Babies(h.Db).GetByIdAsync(baby.GuidId, owner.Id));
    }

    [Fact]
    public async Task Create_rejects_a_blank_name()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Babies(h.Db)
            .CreateAsync(new CreateBabyDto("   ", "#fff", DateTime.UtcNow, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("name", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_birth_date_in_the_future()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Babies(h.Db)
            .CreateAsync(new CreateBabyDto("Ava", "#fff", DateTime.UtcNow.AddDays(1), null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("dateOfBirth", error!.Field);
    }

    [Fact]
    public async Task Create_stops_a_free_user_at_one_baby()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var service = Services.Babies(h.Db);

        var (first, firstError) = await service.CreateAsync(NewBaby("Ava"), user.Id);
        Assert.NotNull(first);
        Assert.Null(firstError);

        var (second, secondError) = await service.CreateAsync(NewBaby("Ben"), user.Id);
        Assert.Null(second);
        Assert.Equal("plan", secondError!.Field);
        Assert.Contains("1 baby profile", secondError.Message);
    }

    [Fact]
    public async Task Create_stops_a_plus_user_at_three_babies()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Plus);
        var service = Services.Babies(h.Db);

        for (var i = 0; i < 3; i++)
            Assert.Null((await service.CreateAsync(NewBaby($"Baby{i}"), user.Id)).error);

        var (dto, error) = await service.CreateAsync(NewBaby("Fourth"), user.Id);
        Assert.Null(dto);
        Assert.Equal("plan", error!.Field);
    }

    [Fact]
    public async Task Create_is_unlimited_on_the_family_plan()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Family);
        var service = Services.Babies(h.Db);

        for (var i = 0; i < 5; i++)
            Assert.Null((await service.CreateAsync(NewBaby($"Baby{i}"), user.Id)).error);

        Assert.Equal(5, (await service.GetAllAsync(user.Id)).Count);
    }

    [Fact]
    public async Task Babies_shared_with_you_do_not_count_against_your_own_plan_cap()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var freeUser = h.Db.AddUser("free@example.com", plan: PlanTier.Free);
        var sharedBaby = h.Db.AddBaby(owner.Id, "Shared");
        h.Db.GrantAccess(sharedBaby.Id, freeUser.Id, CaregiverRole.Log, owner.Id);

        // The shared baby sits on the owner's plan, so a Free user can still add their own.
        var (dto, error) = await Services.Babies(h.Db).CreateAsync(NewBaby("Mine"), freeUser.Id);

        Assert.Null(error);
        Assert.NotNull(dto);
    }

    [Fact]
    public async Task Update_is_refused_for_a_log_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id, "Ava");
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (dto, notFound, error) = await Services.Babies(h.Db)
            .UpdateAsync(baby.GuidId, new UpdateBabyDto("Renamed", null, null, null, null), helper.Id);

        Assert.Null(dto);
        Assert.Null(notFound);
        Assert.NotNull(error);
    }

    [Fact]
    public async Task Update_is_allowed_for_a_full_access_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id, "Ava");
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Full, owner.Id);

        var (dto, _, error) = await Services.Babies(h.Db)
            .UpdateAsync(baby.GuidId, new UpdateBabyDto("Renamed", null, null, null, null), helper.Id);

        Assert.Null(error);
        Assert.Equal("Renamed", dto!.Name);
    }

    [Fact]
    public async Task Update_reports_not_found_when_the_caller_has_no_access_at_all()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        var (_, notFound, _) = await Services.Babies(h.Db)
            .UpdateAsync(baby.GuidId, new UpdateBabyDto("X", null, null, null, null), stranger.Id);

        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task Update_leaves_omitted_fields_untouched()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id, "Ava", "#ff6fa5");

        var (dto, _, _) = await Services.Babies(h.Db)
            .UpdateAsync(baby.GuidId, new UpdateBabyDto("Renamed", null, null, null, null), owner.Id);

        Assert.Equal("Renamed", dto!.Name);
        Assert.Equal("#ff6fa5", dto.AvatarColor);
    }

    [Fact]
    public async Task Delete_is_refused_for_a_full_access_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Full, owner.Id);

        // Sharing never confers the right to destroy someone else's baby profile.
        Assert.False(await Services.Babies(h.Db).DeleteAsync(baby.GuidId, helper.Id));
        Assert.True(await Services.Babies(h.Db).DeleteAsync(baby.GuidId, owner.Id));
    }
}
