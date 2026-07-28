using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Services;

namespace TinyTrack.Api.Features.Caregivers.Services;

/// <summary>
/// The single place that decides who may see or touch a baby's data.
///
/// Before caregiver sharing every row was scoped by <c>UserId</c> alone. That no longer
/// holds: a caregiver's feed log carries *their* UserId but belongs to someone else's
/// baby, and the owner must still see it. So reads are scoped by "babies I can access"
/// unioned with "rows I authored", and writes additionally require a role rank.
///
/// Depends on nothing but the DbContext so both BabyService and CaregiverService can
/// use it without a dependency cycle.
/// </summary>
public class BabyAccessService(AppDbContext db)
{
    /// <summary>The caller's role on a baby, or null if they have no access at all.</summary>
    public async Task<CaregiverRole?> GetRoleAsync(int babyId, int userId)
    {
        var isOwner = await db.Babies.AnyAsync(b => b.Id == babyId && b.UserId == userId);
        if (isOwner) return CaregiverRole.Owner;

        var grant = await db.CaregiverAccess
            .Where(a => a.BabyId == babyId && a.UserId == userId)
            .Select(a => (CaregiverRole?)a.Role)
            .FirstOrDefaultAsync();

        return grant;
    }

    /// <summary>
    /// Internal ids of every baby the user may read: the ones they created plus the ones
    /// shared with them. Materialised as a list so callers can use it inside an EF
    /// <c>Contains</c> without dragging a second query into the expression tree.
    /// </summary>
    public async Task<List<int>> GetAccessibleBabyIdsAsync(int userId)
    {
        var owned = await db.Babies
            .Where(b => b.UserId == userId)
            .Select(b => b.Id)
            .ToListAsync();

        var shared = await db.CaregiverAccess
            .Where(a => a.UserId == userId)
            .Select(a => a.BabyId)
            .ToListAsync();

        return owned.Union(shared).ToList();
    }

    /// <summary>
    /// Resolves a public baby Guid to its internal id, rejecting it unless the caller
    /// holds at least <paramref name="minRole"/>. A null guid means "not baby-scoped"
    /// and always resolves to null with no error — matching the pre-sharing behaviour
    /// where omitting babyId spans everything the caller can see.
    /// </summary>
    public async Task<(int? id, ValidationError? error)> ResolveBabyIdAsync(
        Guid? babyGuidId,
        int userId,
        CaregiverRole minRole = CaregiverRole.Read)
    {
        if (babyGuidId is null) return (null, null);

        var babyId = await db.Babies
            .Where(b => b.GuidId == babyGuidId)
            .Select(b => (int?)b.Id)
            .FirstOrDefaultAsync();

        if (babyId is null) return (null, new ValidationError("babyId", "Baby not found"));

        var role = await GetRoleAsync(babyId.Value, userId);

        // Deliberately the same message for "doesn't exist" and "not yours" so the
        // endpoint can't be used to probe which baby ids are real.
        if (role is null) return (null, new ValidationError("babyId", "Baby not found"));

        if (!role.Value.AtLeast(minRole))
            return (null, new ValidationError("babyId", "You do not have permission to change this baby's data"));

        return (babyId, null);
    }

    /// <summary>
    /// Whether the caller may modify a single existing row. Authoring a row always earns
    /// the right to edit it; otherwise the row's baby must be shared with the caller at
    /// <paramref name="minRole"/> or above.
    /// </summary>
    public async Task<bool> CanModifyRecordAsync(
        int? recordBabyId,
        int recordUserId,
        int userId,
        CaregiverRole minRole = CaregiverRole.Log)
    {
        if (recordUserId == userId) return true;
        if (recordBabyId is null) return false;

        var role = await GetRoleAsync(recordBabyId.Value, userId);
        return role is not null && role.Value.AtLeast(minRole);
    }
}
