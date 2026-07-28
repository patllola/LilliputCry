using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Feeding;

public class FeedingLogServiceTests
{
    // ── Validation ──────────────────────────────────────────────────

    [Fact]
    public async Task Create_rejects_zero_milk_prepared()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 0m, 0m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("milkPrepared", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_feeding_more_than_was_prepared()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 100m, 120m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("milkFed", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_negative_amount_fed()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 100m, -1m, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("milkFed", error!.Field);
    }

    [Fact]
    public async Task Create_allows_a_few_minutes_of_clock_skew_but_not_a_future_feed()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var service = Services.Feeding(h.Db);

        var (skewed, skewError) = await service.CreateAsync(
            new CreateFeedingLogDto(DateTime.UtcNow.AddMinutes(2), 100m, 80m, null, null), user.Id);
        Assert.NotNull(skewed);
        Assert.Null(skewError);

        var (future, futureError) = await service.CreateAsync(
            new CreateFeedingLogDto(DateTime.UtcNow.AddHours(2), 100m, 80m, null, null), user.Id);
        Assert.Null(future);
        Assert.Equal("fedAt", futureError!.Field);
    }

    [Fact]
    public async Task Create_computes_waste_as_prepared_minus_fed()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, _) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 100m, 78.5m, null, null), user.Id);

        Assert.Equal(21.5m, dto!.WasteAmount);
    }

    // ── Access scoping ──────────────────────────────────────────────

    [Fact]
    public async Task GetAll_shows_the_owner_a_log_written_by_their_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        h.Db.AddFeedingLog(helper.Id, baby.Id);

        var logs = await Services.Feeding(h.Db).GetAllAsync(owner.Id);

        Assert.Single(logs);
    }

    [Fact]
    public async Task GetAll_shows_a_caregiver_a_log_written_by_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);
        h.Db.AddFeedingLog(owner.Id, baby.Id);

        var logs = await Services.Feeding(h.Db).GetAllAsync(helper.Id);

        Assert.Single(logs);
    }

    [Fact]
    public async Task GetAll_hides_everything_from_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddFeedingLog(owner.Id, baby.Id);

        Assert.Empty(await Services.Feeding(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task GetAll_still_returns_a_users_own_logs_that_have_no_baby()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        h.Db.AddFeedingLog(user.Id, null);

        Assert.Single(await Services.Feeding(h.Db).GetAllAsync(user.Id));
    }

    [Fact]
    public async Task GetById_is_invisible_to_a_user_without_access()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var log = h.Db.AddFeedingLog(owner.Id, baby.Id);

        Assert.Null(await Services.Feeding(h.Db).GetByIdAsync(log.GuidId, stranger.Id));
        Assert.NotNull(await Services.Feeding(h.Db).GetByIdAsync(log.GuidId, owner.Id));
    }

    [Fact]
    public async Task Create_is_refused_against_a_baby_the_caller_only_reads()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);

        var (dto, error) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 100m, 80m, null, baby.GuidId), reader.Id);

        Assert.Null(dto);
        Assert.Equal("babyId", error!.Field);
    }

    [Fact]
    public async Task Create_succeeds_for_a_log_level_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (dto, error) = await Services.Feeding(h.Db)
            .CreateAsync(new CreateFeedingLogDto(DateTime.UtcNow, 100m, 80m, null, baby.GuidId), helper.Id);

        Assert.Null(error);
        Assert.Equal(baby.GuidId, dto!.BabyId);
    }

    [Fact]
    public async Task Update_is_refused_for_a_read_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var log = h.Db.AddFeedingLog(owner.Id, baby.Id);

        var (dto, notFound, _) = await Services.Feeding(h.Db)
            .UpdateAsync(log.GuidId, new UpdateFeedingLogDto(null, 120m, null, null, null), reader.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task Update_lets_a_log_caregiver_correct_the_owners_entry()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        var log = h.Db.AddFeedingLog(owner.Id, baby.Id, prepared: 100m, fed: 80m);

        var (dto, notFound, error) = await Services.Feeding(h.Db)
            .UpdateAsync(log.GuidId, new UpdateFeedingLogDto(null, null, 90m, null, null), helper.Id);

        Assert.Null(notFound);
        Assert.Null(error);
        Assert.Equal(90m, dto!.MilkFed);
    }

    [Fact]
    public async Task Update_revalidates_against_the_merged_values()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var log = h.Db.AddFeedingLog(user.Id, null, prepared: 100m, fed: 80m);

        // Lowering prepared below the existing fed amount must fail.
        var (dto, _, error) = await Services.Feeding(h.Db)
            .UpdateAsync(log.GuidId, new UpdateFeedingLogDto(null, 50m, null, null, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("milkFed", error!.Field);
    }

    [Fact]
    public async Task Delete_is_refused_for_a_read_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var log = h.Db.AddFeedingLog(owner.Id, baby.Id);

        Assert.False(await Services.Feeding(h.Db).DeleteAsync(log.GuidId, reader.Id));
        Assert.Single(h.NewContext().FeedingLogs);
    }

    [Fact]
    public async Task Delete_succeeds_for_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);
        var log = h.Db.AddFeedingLog(owner.Id, baby.Id);

        Assert.True(await Services.Feeding(h.Db).DeleteAsync(log.GuidId, owner.Id));
        Assert.Empty(h.NewContext().FeedingLogs);
    }

    // ── Paging, ordering and the plan history window ────────────────

    [Fact]
    public async Task GetAll_returns_newest_first()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-5));
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-1));

        var logs = await Services.Feeding(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.True(logs[0].FedAt > logs[1].FedAt);
    }

    [Fact]
    public async Task GetAll_pages_through_results()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        for (var i = 0; i < 5; i++)
            h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-i));

        var page1 = await Services.Feeding(h.Db).GetAllAsync(user.Id, baby.Id, page: 1, pageSize: 2);
        var page2 = await Services.Feeding(h.Db).GetAllAsync(user.Id, baby.Id, page: 2, pageSize: 2);

        Assert.Equal(2, page1.Count);
        Assert.Equal(2, page2.Count);
        Assert.Empty(page1.Select(l => l.GuidId).Intersect(page2.Select(l => l.GuidId)));
    }

    [Fact]
    public async Task GetAll_honours_an_explicit_date_range()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-3));
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddHours(-1));

        var recent = await Services.Feeding(h.Db)
            .GetAllAsync(user.Id, baby.Id, from: DateTime.UtcNow.AddDays(-1));

        Assert.Single(recent);
    }

    [Fact]
    public async Task Free_tier_history_is_clamped_to_seven_days()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-30));
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-1));

        var logs = await Services.Feeding(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.Single(logs);
    }

    [Fact]
    public async Task A_free_user_cannot_widen_their_own_history_window()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-30));

        // Client asks for a year of history; the plan cutoff still wins.
        var logs = await Services.Feeding(h.Db)
            .GetAllAsync(user.Id, baby.Id, from: DateTime.UtcNow.AddYears(-1));

        Assert.Empty(logs);
    }

    [Fact]
    public async Task Paid_tiers_keep_unlimited_history()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Plus);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddFeedingLog(user.Id, baby.Id, DateTime.UtcNow.AddDays(-400));

        Assert.Single(await Services.Feeding(h.Db).GetAllAsync(user.Id, baby.Id));
    }
}
