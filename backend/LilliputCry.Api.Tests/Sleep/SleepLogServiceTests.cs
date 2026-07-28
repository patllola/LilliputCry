using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Sleep.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Sleep;

public class SleepLogServiceTests
{
    [Fact]
    public async Task Create_rejects_an_end_before_the_start()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddHours(-1);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start.AddMinutes(-30)), user.Id);

        Assert.Null(dto);
        Assert.Equal("sleepEnd", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_zero_length_sleep()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddHours(-1);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start), user.Id);

        Assert.Null(dto);
        Assert.Equal("sleepEnd", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_sleep_longer_than_a_day()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddDays(-2);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start.AddHours(25)), user.Id);

        Assert.Null(dto);
        Assert.Equal("sleepEnd", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_start_in_the_future()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddHours(3);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start.AddHours(1)), user.Id);

        Assert.Null(dto);
        Assert.Equal("sleepStart", error!.Field);
    }

    [Fact]
    public async Task Create_derives_duration_from_the_start_and_end()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddHours(-3);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start.AddMinutes(95), IsNap: true), user.Id);

        Assert.Null(error);
        Assert.Equal(95, dto!.DurationMinutes, precision: 3);
        Assert.True(dto.IsNap);
    }

    [Fact]
    public async Task GetAll_spans_both_the_owners_and_the_caregivers_entries()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        h.Db.AddSleepLog(owner.Id, baby.Id, DateTime.UtcNow.AddHours(-6));
        h.Db.AddSleepLog(helper.Id, baby.Id, DateTime.UtcNow.AddHours(-2));

        Assert.Equal(2, (await Services.Sleep(h.Db).GetAllAsync(owner.Id)).Count);
        Assert.Equal(2, (await Services.Sleep(h.Db).GetAllAsync(helper.Id)).Count);
    }

    [Fact]
    public async Task GetAll_hides_everything_from_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddSleepLog(owner.Id, baby.Id);

        Assert.Empty(await Services.Sleep(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task GetAll_returns_newest_first()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddSleepLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-10));
        h.Db.AddSleepLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-2));

        var logs = await Services.Sleep(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.True(logs[0].SleepStart > logs[1].SleepStart);
    }

    [Fact]
    public async Task Free_tier_history_is_clamped_to_seven_days()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddSleepLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-20));
        h.Db.AddSleepLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-2));

        Assert.Single(await Services.Sleep(h.Db).GetAllAsync(user.Id, baby.Id));
    }

    [Fact]
    public async Task Create_is_refused_against_a_baby_the_caller_only_reads()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var start = DateTime.UtcNow.AddHours(-2);

        var (dto, error) = await Services.Sleep(h.Db)
            .CreateAsync(new CreateSleepLogDto(start, start.AddHours(1), BabyId: baby.GuidId), reader.Id);

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
        var log = h.Db.AddSleepLog(owner.Id, baby.Id);

        var (dto, notFound, _) = await Services.Sleep(h.Db)
            .UpdateAsync(log.GuidId, new UpdateSleepLogDto(null, null, true, null, null), reader.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task Update_revalidates_the_merged_window()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var start = DateTime.UtcNow.AddHours(-4);
        var log = h.Db.AddSleepLog(user.Id, null, start, hours: 2);

        // Moving the start past the existing end must fail.
        var (dto, _, error) = await Services.Sleep(h.Db)
            .UpdateAsync(log.GuidId, new UpdateSleepLogDto(start.AddHours(3), null, null, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("sleepEnd", error!.Field);
    }

    [Fact]
    public async Task Delete_is_refused_for_a_read_only_caregiver_and_allowed_for_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var log = h.Db.AddSleepLog(owner.Id, baby.Id);

        Assert.False(await Services.Sleep(h.Db).DeleteAsync(log.GuidId, reader.Id));
        Assert.True(await Services.Sleep(h.Db).DeleteAsync(log.GuidId, owner.Id));
    }
}
