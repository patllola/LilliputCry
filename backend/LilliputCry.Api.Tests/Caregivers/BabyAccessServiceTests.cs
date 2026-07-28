using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Caregivers;

public class BabyAccessServiceTests
{
    [Fact]
    public async Task GetRole_returns_Owner_for_the_creator()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var baby = h.Db.AddBaby(owner.Id);

        var role = await Services.Access(h.Db).GetRoleAsync(baby.Id, owner.Id);

        Assert.Equal(CaregiverRole.Owner, role);
    }

    [Fact]
    public async Task GetRole_returns_null_for_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        var role = await Services.Access(h.Db).GetRoleAsync(baby.Id, stranger.Id);

        Assert.Null(role);
    }

    [Fact]
    public async Task GetRole_returns_the_granted_role_for_a_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);

        var role = await Services.Access(h.Db).GetRoleAsync(baby.Id, helper.Id);

        Assert.Equal(CaregiverRole.Read, role);
    }

    [Fact]
    public async Task GetAccessibleBabyIds_covers_owned_and_shared_babies()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var ownBaby = h.Db.AddBaby(helper.Id, "Own");
        var sharedBaby = h.Db.AddBaby(owner.Id, "Shared");
        var hiddenBaby = h.Db.AddBaby(owner.Id, "Hidden");
        h.Db.GrantAccess(sharedBaby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var ids = await Services.Access(h.Db).GetAccessibleBabyIdsAsync(helper.Id);

        Assert.Contains(ownBaby.Id, ids);
        Assert.Contains(sharedBaby.Id, ids);
        Assert.DoesNotContain(hiddenBaby.Id, ids);
    }

    [Fact]
    public async Task ResolveBabyId_rejects_a_baby_the_caller_cannot_see()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);

        var (id, error) = await Services.Access(h.Db).ResolveBabyIdAsync(baby.GuidId, stranger.Id);

        Assert.Null(id);
        Assert.NotNull(error);
        // Same wording as a genuinely missing baby, so ids can't be probed.
        Assert.Equal("Baby not found", error!.Message);
    }

    [Fact]
    public async Task ResolveBabyId_rejects_a_read_only_caregiver_when_write_access_is_required()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);

        var access = Services.Access(h.Db);

        var (readId, readError) = await access.ResolveBabyIdAsync(baby.GuidId, reader.Id, CaregiverRole.Read);
        Assert.Equal(baby.Id, readId);
        Assert.Null(readError);

        var (writeId, writeError) = await access.ResolveBabyIdAsync(baby.GuidId, reader.Id, CaregiverRole.Log);
        Assert.Null(writeId);
        Assert.NotNull(writeError);
    }

    [Fact]
    public async Task ResolveBabyId_treats_a_null_guid_as_unscoped()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (id, error) = await Services.Access(h.Db).ResolveBabyIdAsync(null, user.Id);

        Assert.Null(id);
        Assert.Null(error);
    }

    [Fact]
    public async Task CanModifyRecord_allows_the_author_even_without_baby_access()
    {
        using var h = new TestDb();
        var author = h.Db.AddUser();

        var can = await Services.Access(h.Db).CanModifyRecordAsync(null, author.Id, author.Id);

        Assert.True(can);
    }

    [Fact]
    public async Task CanModifyRecord_lets_an_owner_edit_a_caregivers_entry()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);

        var can = await Services.Access(h.Db).CanModifyRecordAsync(baby.Id, helper.Id, owner.Id);

        Assert.True(can);
    }

    [Fact]
    public async Task CanModifyRecord_blocks_a_read_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);

        var can = await Services.Access(h.Db).CanModifyRecordAsync(baby.Id, owner.Id, reader.Id);

        Assert.False(can);
    }

    [Theory]
    [InlineData("full", CaregiverRole.Full)]
    [InlineData("LOG", CaregiverRole.Log)]
    [InlineData(" read ", CaregiverRole.Read)]
    public void TryParseWire_accepts_the_roles_the_client_sends(string input, CaregiverRole expected)
    {
        Assert.True(CaregiverRoleExtensions.TryParseWire(input, out var role));
        Assert.Equal(expected, role);
    }

    [Theory]
    [InlineData("owner")]  // implicit — must never be grantable
    [InlineData("admin")]
    [InlineData("")]
    [InlineData(null)]
    public void TryParseWire_rejects_anything_else(string? input)
    {
        Assert.False(CaregiverRoleExtensions.TryParseWire(input, out _));
    }

    [Fact]
    public void Role_ranking_orders_least_to_most_privileged()
    {
        Assert.True(CaregiverRole.Owner.AtLeast(CaregiverRole.Full));
        Assert.True(CaregiverRole.Full.AtLeast(CaregiverRole.Log));
        Assert.True(CaregiverRole.Log.AtLeast(CaregiverRole.Read));
        Assert.False(CaregiverRole.Read.AtLeast(CaregiverRole.Log));
        Assert.False(CaregiverRole.Log.AtLeast(CaregiverRole.Full));
    }
}
