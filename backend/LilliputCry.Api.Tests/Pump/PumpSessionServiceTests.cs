using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Pump.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Pump;

public class PumpSessionServiceTests
{
    [Fact]
    public async Task Create_rejects_a_session_with_nothing_pumped_on_either_side()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow, 0m, 0m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("leftAmount", error!.Field);
    }

    [Fact]
    public async Task Create_accepts_a_single_sided_session()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow, 0m, 45m, null, null), user.Id);

        Assert.Null(error);
        Assert.Equal(45m, dto!.TotalAmount);
    }

    [Fact]
    public async Task Create_rejects_negative_amounts()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow, -5m, 40m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("leftAmount", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_session_in_the_future()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow.AddHours(1), 30m, 30m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("pumpedAt", error!.Field);
    }

    [Fact]
    public async Task Total_is_the_sum_of_both_sides()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, _) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow, 62.5m, 37.5m, null, null), user.Id);

        Assert.Equal(100m, dto!.TotalAmount);
    }

    [Fact]
    public async Task GetAll_spans_the_owner_and_their_caregivers()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        h.Db.AddPumpSession(helper.Id, baby.Id);

        Assert.Single(await Services.Pump(h.Db).GetAllAsync(owner.Id));
    }

    [Fact]
    public async Task GetAll_hides_everything_from_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddPumpSession(owner.Id, baby.Id);

        Assert.Empty(await Services.Pump(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task GetAll_returns_newest_first()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddPumpSession(user.Id, baby.Id, DateTime.UtcNow.AddHours(-8));
        h.Db.AddPumpSession(user.Id, baby.Id, DateTime.UtcNow.AddHours(-1));

        var sessions = await Services.Pump(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.True(sessions[0].PumpedAt > sessions[1].PumpedAt);
    }

    [Fact]
    public async Task Free_tier_history_is_clamped_to_seven_days()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddPumpSession(user.Id, baby.Id, DateTime.UtcNow.AddDays(-14));
        h.Db.AddPumpSession(user.Id, baby.Id, DateTime.UtcNow.AddDays(-1));

        Assert.Single(await Services.Pump(h.Db).GetAllAsync(user.Id, baby.Id));
    }

    [Fact]
    public async Task Create_is_refused_against_a_baby_the_caller_only_reads()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);

        var (dto, error) = await Services.Pump(h.Db)
            .CreateAsync(new CreatePumpSessionDto(DateTime.UtcNow, 50m, 50m, null, baby.GuidId), reader.Id);

        Assert.Null(dto);
        Assert.Equal("babyId", error!.Field);
    }

    [Fact]
    public async Task Update_is_refused_for_a_read_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var session = h.Db.AddPumpSession(owner.Id, baby.Id);

        var (dto, notFound, _) = await Services.Pump(h.Db)
            .UpdateAsync(session.GuidId, new UpdatePumpSessionDto(null, 10m, null, null, null), reader.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task Update_lets_a_log_caregiver_correct_the_owners_session()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        var session = h.Db.AddPumpSession(owner.Id, baby.Id, left: 60m, right: 40m);

        var (dto, _, error) = await Services.Pump(h.Db)
            .UpdateAsync(session.GuidId, new UpdatePumpSessionDto(null, 70m, null, null, null), helper.Id);

        Assert.Null(error);
        Assert.Equal(110m, dto!.TotalAmount);
    }

    [Fact]
    public async Task Delete_is_refused_for_a_read_only_caregiver_and_allowed_for_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var session = h.Db.AddPumpSession(owner.Id, baby.Id);

        Assert.False(await Services.Pump(h.Db).DeleteAsync(session.GuidId, reader.Id));
        Assert.True(await Services.Pump(h.Db).DeleteAsync(session.GuidId, owner.Id));
    }
}
