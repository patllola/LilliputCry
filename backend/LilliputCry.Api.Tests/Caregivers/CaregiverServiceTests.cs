using LilliputCry.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Features.Caregivers.DTOs;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Caregivers;

public class CaregiverServiceTests
{
    [Fact]
    public async Task GetCaregivers_lists_the_owner_first_then_grants()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser(fullName: "Maya");
        var helper = h.Db.AddUser("helper@example.com", "Daniel");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (list, error) = await Services.Caregivers(h.Db).GetCaregiversAsync(baby.GuidId, owner.Id);

        Assert.Null(error);
        Assert.Equal(2, list!.Count);
        Assert.Equal("owner", list[0].Role);
        Assert.Equal("Maya", list[0].Name);
        Assert.True(list[0].IsYou);
        Assert.Equal("log", list[1].Role);
        Assert.Equal("Daniel", list[1].Name);
        Assert.False(list[1].IsYou);
    }

    [Fact]
    public async Task GetCaregivers_rejects_a_stranger()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        var (list, error) = await Services.Caregivers(h.Db).GetCaregiversAsync(baby.GuidId, stranger.Id);

        Assert.Null(list);
        Assert.NotNull(error);
    }

    [Fact]
    public async Task CreateInvite_stores_a_pending_invite_and_returns_the_token_once()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("Grandma@Example.com", "log", baby.GuidId), owner.Id);

        Assert.Null(error);
        Assert.NotNull(dto);
        Assert.Equal("grandma@example.com", dto!.Email);   // normalised for case-insensitive matching
        Assert.Equal("log", dto.Role);
        Assert.False(string.IsNullOrWhiteSpace(dto.Token));

        var stored = await h.NewContext().CaregiverInvites.SingleAsync();
        Assert.Equal(CaregiverInviteStatus.Pending, stored.Status);
        Assert.Equal(baby.Id, stored.BabyId);
    }

    [Fact]
    public async Task CreateInvite_rejects_a_role_the_client_should_never_send()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("x@example.com", "owner", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("role", error!.Field);
    }

    [Fact]
    public async Task CreateInvite_is_blocked_for_a_log_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("x@example.com", "log", baby.GuidId), helper.Id);

        Assert.Null(dto);
        Assert.NotNull(error);
    }

    [Fact]
    public async Task CreateInvite_rejects_a_duplicate_pending_invite()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "grandma@example.com");

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("grandma@example.com", "log", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("email", error!.Field);
    }

    [Fact]
    public async Task CreateInvite_rejects_inviting_yourself()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser("me@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("ME@example.com", "log", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("email", error!.Field);
    }

    [Fact]
    public async Task CreateInvite_rejects_someone_who_is_already_a_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("helper@example.com", "full", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("email", error!.Field);
    }

    [Fact]
    public async Task CreateInvite_is_refused_on_a_plan_without_caregiver_seats()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser(plan: PlanTier.Plus);   // Plus includes 0 seats
        var baby = h.Db.AddBaby(owner.Id);

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("grandma@example.com", "log", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("plan", error!.Field);
        Assert.Contains("Family", error.Message);
    }

    [Fact]
    public async Task CreateInvite_is_refused_once_every_family_seat_is_taken()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser(plan: PlanTier.Family);   // 4 seats
        var baby = h.Db.AddBaby(owner.Id);
        for (var i = 0; i < 4; i++)
            h.Db.AddInvite(baby.Id, owner.Id, $"seat{i}@example.com");

        var (dto, error) = await Services.Caregivers(h.Db)
            .CreateInviteAsync(new CreateInviteDto("fifth@example.com", "log", baby.GuidId), owner.Id);

        Assert.Null(dto);
        Assert.Equal("plan", error!.Field);
    }

    [Fact]
    public async Task AcceptInvite_grants_access_and_closes_the_invite()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var invite = h.Db.AddInvite(baby.Id, owner.Id, "helper@example.com", CaregiverRole.Full, token: "tok-123");

        var (dto, error) = await Services.Caregivers(h.Db).AcceptInviteAsync("tok-123", helper.Id);

        Assert.Null(error);
        Assert.Equal("full", dto!.Role);
        Assert.True(dto.IsYou);

        await using var verify = h.NewContext();
        Assert.Equal(CaregiverInviteStatus.Accepted, (await verify.CaregiverInvites.SingleAsync(i => i.Id == invite.Id)).Status);
        Assert.Equal(CaregiverRole.Full, (await verify.CaregiverAccess.SingleAsync()).Role);
    }

    [Fact]
    public async Task AcceptInvite_refuses_an_account_the_invite_was_not_addressed_to()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var wrongPerson = h.Db.AddUser("someone.else@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "helper@example.com", token: "tok-123");

        var (dto, error) = await Services.Caregivers(h.Db).AcceptInviteAsync("tok-123", wrongPerson.Id);

        Assert.Null(dto);
        Assert.Equal("token", error!.Field);
        Assert.Empty(h.NewContext().CaregiverAccess);
    }

    [Fact]
    public async Task AcceptInvite_refuses_an_expired_invite()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "helper@example.com",
            token: "tok-123", expiresAt: DateTime.UtcNow.AddDays(-1));

        var (dto, error) = await Services.Caregivers(h.Db).AcceptInviteAsync("tok-123", helper.Id);

        Assert.Null(dto);
        Assert.Contains("expired", error!.Message);
    }

    [Fact]
    public async Task AcceptInvite_refuses_an_unknown_token()
    {
        using var h = new TestDb();
        var helper = h.Db.AddUser("helper@example.com");

        var (dto, error) = await Services.Caregivers(h.Db).AcceptInviteAsync("nope", helper.Id);

        Assert.Null(dto);
        Assert.NotNull(error);
    }

    [Fact]
    public async Task AcceptInvite_upgrades_an_existing_grant_rather_than_duplicating_it()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "helper@example.com", CaregiverRole.Full, token: "tok-123");

        var (dto, error) = await Services.Caregivers(h.Db).AcceptInviteAsync("tok-123", helper.Id);

        Assert.Null(error);
        Assert.Equal("full", dto!.Role);
        var grants = await h.NewContext().CaregiverAccess.ToListAsync();
        Assert.Single(grants);
        Assert.Equal(CaregiverRole.Full, grants[0].Role);
    }

    [Fact]
    public async Task CancelInvite_marks_it_cancelled_and_drops_it_from_the_pending_list()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);
        var invite = h.Db.AddInvite(baby.Id, owner.Id, "grandma@example.com");
        var service = Services.Caregivers(h.Db);

        var (ok, _) = await service.CancelInviteAsync(invite.GuidId, owner.Id);

        Assert.True(ok);
        var (pending, _) = await service.GetPendingInvitesAsync(baby.GuidId, owner.Id);
        Assert.Empty(pending!);
    }

    [Fact]
    public async Task CancelInvite_is_refused_for_someone_elses_baby()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var invite = h.Db.AddInvite(baby.Id, owner.Id, "grandma@example.com");

        var (ok, _) = await Services.Caregivers(h.Db).CancelInviteAsync(invite.GuidId, stranger.Id);

        Assert.False(ok);
    }

    [Fact]
    public async Task GetPendingInvites_hides_expired_ones()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "live@example.com");
        h.Db.AddInvite(baby.Id, owner.Id, "stale@example.com", expiresAt: DateTime.UtcNow.AddDays(-1));

        var (pending, _) = await Services.Caregivers(h.Db).GetPendingInvitesAsync(baby.GuidId, owner.Id);

        Assert.Single(pending!);
        Assert.Equal("live@example.com", pending![0].Email);
    }

    [Fact]
    public async Task GetInvitesForMe_matches_on_the_callers_email()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("Helper@Example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddInvite(baby.Id, owner.Id, "helper@example.com");
        h.Db.AddInvite(baby.Id, owner.Id, "someone.else@example.com");

        var mine = await Services.Caregivers(h.Db).GetInvitesForMeAsync(helper.Id);

        Assert.Single(mine);
        Assert.Equal("helper@example.com", mine[0].Email);
    }

    [Fact]
    public async Task RemoveCaregiver_lets_a_caregiver_leave_on_their_own()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var grant = h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (ok, _) = await Services.Caregivers(h.Db).RemoveCaregiverAsync(grant.GuidId, helper.Id);

        Assert.True(ok);
        Assert.Empty(h.NewContext().CaregiverAccess);
    }

    [Fact]
    public async Task RemoveCaregiver_is_refused_for_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var grant = h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var (ok, _) = await Services.Caregivers(h.Db).RemoveCaregiverAsync(grant.GuidId, stranger.Id);

        Assert.False(ok);
        Assert.Single(h.NewContext().CaregiverAccess);
    }

    [Fact]
    public async Task Revoking_access_leaves_the_logs_that_caregiver_wrote_intact()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var grant = h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        h.Db.AddFeedingLog(helper.Id, baby.Id);

        await Services.Caregivers(h.Db).RemoveCaregiverAsync(grant.GuidId, owner.Id);

        // The baby's history must survive the caregiver leaving.
        Assert.Single(h.NewContext().FeedingLogs);
        var stillVisible = await Services.Feeding(h.Db).GetAllAsync(owner.Id, baby.Id);
        Assert.Single(stillVisible);
    }

    [Fact]
    public async Task UpdateRole_changes_a_grant_and_takes_effect_immediately()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var grant = h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);

        var (dto, notFound, error) = await Services.Caregivers(h.Db)
            .UpdateRoleAsync(grant.GuidId, "full", owner.Id);

        Assert.Null(notFound);
        Assert.Null(error);
        Assert.Equal("full", dto!.Role);
        Assert.Equal(CaregiverRole.Full, await Services.Access(h.Db).GetRoleAsync(baby.Id, helper.Id));
    }

    [Fact]
    public async Task UpdateRole_is_refused_for_a_log_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var other = h.Db.AddUser("other@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        var otherGrant = h.Db.GrantAccess(baby.Id, other.Id, CaregiverRole.Read, owner.Id);

        var (dto, notFound, _) = await Services.Caregivers(h.Db)
            .UpdateRoleAsync(otherGrant.GuidId, "full", helper.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }
}
