using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Milestones;

/// <summary>
/// Covers the paths that never reach Cloudinary — reads, and writes rejected before an
/// upload would happen. Creating and replacing images needs a live Cloudinary account, so
/// that belongs in an integration test rather than here.
/// </summary>
public class MilestoneServiceTests
{
    [Fact]
    public async Task GetAll_shows_a_caregiver_the_owners_milestones()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);
        h.Db.AddMilestone(owner.Id, baby.Id);

        Assert.Single(await Services.Milestones(h.Db).GetAllAsync(helper.Id));
    }

    [Fact]
    public async Task GetAll_hides_everything_from_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddMilestone(owner.Id, baby.Id);

        Assert.Empty(await Services.Milestones(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task GetAll_returns_newest_first()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddMilestone(user.Id, baby.Id, DateTime.UtcNow.AddDays(-5), "Older");
        h.Db.AddMilestone(user.Id, baby.Id, DateTime.UtcNow.AddDays(-1), "Newer");

        var list = await Services.Milestones(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.Equal("Newer", list[0].Note);
    }

    [Fact]
    public async Task GetAll_pages_through_results()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        for (var i = 0; i < 5; i++)
            h.Db.AddMilestone(user.Id, baby.Id, DateTime.UtcNow.AddDays(-i), $"Note {i}");

        var page1 = await Services.Milestones(h.Db).GetAllAsync(user.Id, baby.Id, page: 1, pageSize: 2);
        var page2 = await Services.Milestones(h.Db).GetAllAsync(user.Id, baby.Id, page: 2, pageSize: 2);

        Assert.Equal(2, page1.Count);
        Assert.Empty(page1.Select(m => m.GuidId).Intersect(page2.Select(m => m.GuidId)));
    }

    [Fact]
    public async Task Free_tier_history_is_clamped_to_seven_days()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddMilestone(user.Id, baby.Id, DateTime.UtcNow.AddDays(-40), "Old");
        h.Db.AddMilestone(user.Id, baby.Id, DateTime.UtcNow.AddDays(-2), "Recent");

        var list = await Services.Milestones(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.Single(list);
        Assert.Equal("Recent", list[0].Note);
    }

    [Fact]
    public async Task GetById_is_invisible_to_a_user_without_access()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var milestone = h.Db.AddMilestone(owner.Id, baby.Id);

        Assert.Null(await Services.Milestones(h.Db).GetByIdAsync(milestone.GuidId, stranger.Id));
        Assert.NotNull(await Services.Milestones(h.Db).GetByIdAsync(milestone.GuidId, owner.Id));
    }

    [Fact]
    public async Task Delete_is_refused_before_any_image_teardown_when_access_is_missing()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var milestone = h.Db.AddMilestone(owner.Id, baby.Id);

        // Returns false without ever calling Cloudinary — the authorization check comes first.
        Assert.False(await Services.Milestones(h.Db).DeleteAsync(milestone.GuidId, reader.Id));
        Assert.Single(h.NewContext().Milestones);
    }

    [Fact]
    public async Task Delete_reports_missing_for_an_unknown_id()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        Assert.False(await Services.Milestones(h.Db).DeleteAsync(Guid.NewGuid(), user.Id));
    }
}
