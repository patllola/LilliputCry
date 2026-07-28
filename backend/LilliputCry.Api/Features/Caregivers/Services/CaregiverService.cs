using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Caregivers.DTOs;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace TinyTrack.Api.Features.Caregivers.Services;

public class CaregiverService(AppDbContext db, BabyAccessService access, PlanLimitService planLimits)
{
    private static readonly TimeSpan InviteLifetime = TimeSpan.FromDays(14);

    // ── Reads ───────────────────────────────────────────────────────

    /// <summary>
    /// Everyone with access to a baby, owner first. The owner row is synthesised from
    /// Baby.UserId rather than stored, so it can never be revoked or drift.
    /// </summary>
    public async Task<(List<CaregiverResponseDto>? list, ValidationError? error)> GetCaregiversAsync(Guid babyGuidId, int userId)
    {
        var (babyId, error) = await access.ResolveBabyIdAsync(babyGuidId, userId, CaregiverRole.Read);
        if (error is not null) return (null, error);

        var baby = await db.Babies
            .Include(b => b.User)
            .Where(b => b.Id == babyId)
            .Select(b => new
            {
                b.AvatarColor,
                b.CreatedAt,
                OwnerId = b.User.Id,
                OwnerGuid = b.User.GuidId,
                OwnerName = b.User.FullName,
                OwnerEmail = b.User.Email
            })
            .FirstAsync();

        // The owner has no CaregiverAccess row, so its user guid stands in as the
        // list-row id. Nothing addresses an owner row by id — it can't be edited or removed.
        var result = new List<CaregiverResponseDto>
        {
            new(
                baby.OwnerGuid,
                baby.OwnerGuid,
                baby.OwnerName,
                baby.OwnerEmail,
                CaregiverRole.Owner.ToWire(),
                baby.AvatarColor,
                IsYou: baby.OwnerId == userId,
                baby.CreatedAt)
        };

        var grants = await db.CaregiverAccess
            .Include(a => a.User)
            .Where(a => a.BabyId == babyId)
            .OrderBy(a => a.CreatedAt)
            .Select(a => new
            {
                a.GuidId,
                a.Role,
                a.CreatedAt,
                a.UserId,
                UserGuid = a.User.GuidId,
                a.User.FullName,
                a.User.Email
            })
            .ToListAsync();

        result.AddRange(grants.Select(g => new CaregiverResponseDto(
            g.GuidId,
            g.UserGuid,
            g.FullName,
            g.Email,
            g.Role.ToWire(),
            baby.AvatarColor,
            IsYou: g.UserId == userId,
            g.CreatedAt)));

        return (result, null);
    }

    /// <summary>
    /// Outstanding invites. Scoped to one baby when <paramref name="babyGuidId"/> is given,
    /// otherwise every invite the caller has issued across their babies.
    /// </summary>
    public async Task<(List<PendingInviteResponseDto>? list, ValidationError? error)> GetPendingInvitesAsync(Guid? babyGuidId, int userId)
    {
        var now = DateTime.UtcNow;
        IQueryable<CaregiverInvite> query = db.CaregiverInvites.Include(i => i.Baby);

        if (babyGuidId is not null)
        {
            var (babyId, error) = await access.ResolveBabyIdAsync(babyGuidId, userId, CaregiverRole.Full);
            if (error is not null) return (null, error);
            query = query.Where(i => i.BabyId == babyId);
        }
        else
        {
            // Only babies the caller can administer — a Log-only caregiver shouldn't see
            // who else has been invited.
            var manageable = await GetManageableBabyIdsAsync(userId);
            query = query.Where(i => manageable.Contains(i.BabyId));
        }

        var invites = await query
            .Where(i => i.Status == CaregiverInviteStatus.Pending && i.ExpiresAt > now)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new PendingInviteResponseDto(
                i.GuidId,
                i.Email,
                i.Role.ToWire(),
                i.CreatedAt,
                i.ExpiresAt,
                i.Baby.GuidId,
                i.Baby.Name))
            .ToListAsync();

        return (invites, null);
    }

    /// <summary>Invites addressed to the caller's own email that they can still accept.</summary>
    public async Task<List<PendingInviteResponseDto>> GetInvitesForMeAsync(int userId)
    {
        var email = await db.Users.Where(u => u.Id == userId).Select(u => u.Email).FirstOrDefaultAsync();
        if (email is null) return [];

        var normalized = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        return await db.CaregiverInvites
            .Include(i => i.Baby)
            .Where(i => i.Email == normalized
                        && i.Status == CaregiverInviteStatus.Pending
                        && i.ExpiresAt > now)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new PendingInviteResponseDto(
                i.GuidId,
                i.Email,
                i.Role.ToWire(),
                i.CreatedAt,
                i.ExpiresAt,
                i.Baby.GuidId,
                i.Baby.Name))
            .ToListAsync();
    }

    // ── Writes ──────────────────────────────────────────────────────

    public async Task<(CreatedInviteResponseDto? dto, ValidationError? error)> CreateInviteAsync(CreateInviteDto input, int userId)
    {
        if (!CaregiverRoleExtensions.TryParseWire(input.Role, out var role))
            return (null, new("role", "Role must be one of: full, log, read"));

        // Only an owner or a Full-access caregiver may hand out access.
        var (babyId, error) = await access.ResolveBabyIdAsync(input.BabyId, userId, CaregiverRole.Full);
        if (error is not null) return (null, error);

        var email = input.Email.Trim().ToLowerInvariant();

        var self = await db.Users.Where(u => u.Id == userId).Select(u => u.Email).FirstAsync();
        if (string.Equals(self.Trim(), email, StringComparison.OrdinalIgnoreCase))
            return (null, new("email", "You already have access to this baby"));

        // Already a caregiver? Nothing to invite.
        var alreadyHasAccess = await db.CaregiverAccess
            .Include(a => a.User)
            .AnyAsync(a => a.BabyId == babyId && a.User.Email.ToLower() == email);
        if (alreadyHasAccess)
            return (null, new("email", "That person is already a caregiver for this baby"));

        var babyOwnerEmail = await db.Babies
            .Where(b => b.Id == babyId)
            .Select(b => b.User.Email)
            .FirstAsync();
        if (string.Equals(babyOwnerEmail.Trim(), email, StringComparison.OrdinalIgnoreCase))
            return (null, new("email", "That person owns this baby's profile"));

        var now = DateTime.UtcNow;

        var duplicate = await db.CaregiverInvites
            .AnyAsync(i => i.BabyId == babyId
                           && i.Email == email
                           && i.Status == CaregiverInviteStatus.Pending
                           && i.ExpiresAt > now);
        if (duplicate)
            return (null, new("email", "An invite is already pending for that email"));

        // Seat limit is counted against the inviting user's plan: existing caregivers
        // across all their babies, plus invites still outstanding.
        var seatError = await CheckSeatLimitAsync(userId);
        if (seatError is not null) return (null, seatError);

        var invite = new CaregiverInvite
        {
            BabyId = babyId!.Value,
            InvitedByUserId = userId,
            Email = email,
            Role = role,
            Token = GenerateToken(),
            Status = CaregiverInviteStatus.Pending,
            ExpiresAt = now.Add(InviteLifetime),
            CreatedAt = now,
            UpdatedAt = now
        };

        db.CaregiverInvites.Add(invite);
        await db.SaveChangesAsync();

        var babyInfo = await db.Babies
            .Where(b => b.Id == babyId)
            .Select(b => new { b.GuidId, b.Name })
            .FirstAsync();

        return (new CreatedInviteResponseDto(
            invite.GuidId,
            invite.Email,
            invite.Role.ToWire(),
            invite.CreatedAt,
            invite.ExpiresAt,
            babyInfo.GuidId,
            babyInfo.Name,
            invite.Token), null);
    }

    public async Task<(bool ok, string? notFound)> CancelInviteAsync(Guid inviteGuidId, int userId)
    {
        var invite = await db.CaregiverInvites
            .FirstOrDefaultAsync(i => i.GuidId == inviteGuidId && i.Status == CaregiverInviteStatus.Pending);
        if (invite is null) return (false, "not_found");

        var role = await access.GetRoleAsync(invite.BabyId, userId);
        if (role is null || !role.Value.AtLeast(CaregiverRole.Full)) return (false, "not_found");

        invite.Status = CaregiverInviteStatus.Cancelled;
        invite.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (true, null);
    }

    /// <summary>
    /// Redeems a token for the signed-in user. The invite's email must match the
    /// accepting account, so a leaked token alone is not enough to gain access.
    /// </summary>
    public async Task<(CaregiverResponseDto? dto, ValidationError? error)> AcceptInviteAsync(string token, int userId)
    {
        var now = DateTime.UtcNow;

        var invite = await db.CaregiverInvites
            .Include(i => i.Baby)
            .FirstOrDefaultAsync(i => i.Token == token && i.Status == CaregiverInviteStatus.Pending);

        if (invite is null) return (null, new("token", "Invite not found or already used"));
        if (invite.ExpiresAt <= now) return (null, new("token", "This invite has expired"));

        var user = await db.Users.Where(u => u.Id == userId)
            .Select(u => new { u.GuidId, u.Email, u.FullName })
            .FirstAsync();

        if (!string.Equals(user.Email.Trim(), invite.Email, StringComparison.OrdinalIgnoreCase))
            return (null, new("token", "This invite was sent to a different email address"));

        if (invite.Baby.UserId == userId)
            return (null, new("token", "You already own this baby's profile"));

        var existing = await db.CaregiverAccess
            .FirstOrDefaultAsync(a => a.BabyId == invite.BabyId && a.UserId == userId);

        CaregiverAccess grant;
        if (existing is not null)
        {
            // Re-invited at a different level — take the new role.
            existing.Role = invite.Role;
            existing.UpdatedAt = now;
            grant = existing;
        }
        else
        {
            grant = new CaregiverAccess
            {
                BabyId = invite.BabyId,
                UserId = userId,
                GrantedByUserId = invite.InvitedByUserId,
                Role = invite.Role,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.CaregiverAccess.Add(grant);
        }

        invite.Status = CaregiverInviteStatus.Accepted;
        invite.AcceptedAt = now;
        invite.AcceptedByUserId = userId;
        invite.UpdatedAt = now;

        await db.SaveChangesAsync();

        return (new CaregiverResponseDto(
            grant.GuidId,
            user.GuidId,
            user.FullName,
            user.Email,
            grant.Role.ToWire(),
            invite.Baby.AvatarColor,
            IsYou: true,
            grant.CreatedAt), null);
    }

    public async Task<(CaregiverResponseDto? dto, string? notFound, ValidationError? error)> UpdateRoleAsync(
        Guid accessGuidId, string wireRole, int userId)
    {
        if (!CaregiverRoleExtensions.TryParseWire(wireRole, out var role))
            return (null, null, new("role", "Role must be one of: full, log, read"));

        var grant = await db.CaregiverAccess
            .Include(a => a.User)
            .Include(a => a.Baby)
            .FirstOrDefaultAsync(a => a.GuidId == accessGuidId);
        if (grant is null) return (null, "not_found", null);

        var callerRole = await access.GetRoleAsync(grant.BabyId, userId);
        if (callerRole is null || !callerRole.Value.AtLeast(CaregiverRole.Full))
            return (null, "not_found", null);

        grant.Role = role;
        grant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return (new CaregiverResponseDto(
            grant.GuidId,
            grant.User.GuidId,
            grant.User.FullName,
            grant.User.Email,
            grant.Role.ToWire(),
            grant.Baby.AvatarColor,
            IsYou: grant.UserId == userId,
            grant.CreatedAt), null, null);
    }

    /// <summary>
    /// Revokes access. Owners/Full caregivers can remove anyone; any caregiver can
    /// remove themselves (leave). Rows the removed caregiver already logged stay put —
    /// deleting a grant must not silently destroy the baby's history.
    /// </summary>
    public async Task<(bool ok, string? notFound)> RemoveCaregiverAsync(Guid accessGuidId, int userId)
    {
        var grant = await db.CaregiverAccess.FirstOrDefaultAsync(a => a.GuidId == accessGuidId);
        if (grant is null) return (false, "not_found");

        if (grant.UserId != userId)
        {
            var callerRole = await access.GetRoleAsync(grant.BabyId, userId);
            if (callerRole is null || !callerRole.Value.AtLeast(CaregiverRole.Full))
                return (false, "not_found");
        }

        db.CaregiverAccess.Remove(grant);
        await db.SaveChangesAsync();
        return (true, null);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    /// Babies the caller owns or holds Full access on — i.e. can administer sharing for.
    private async Task<List<int>> GetManageableBabyIdsAsync(int userId)
    {
        var owned = await db.Babies.Where(b => b.UserId == userId).Select(b => b.Id).ToListAsync();
        var full = await db.CaregiverAccess
            .Where(a => a.UserId == userId && a.Role == CaregiverRole.Full)
            .Select(a => a.BabyId)
            .ToListAsync();
        return owned.Union(full).ToList();
    }

    private async Task<ValidationError?> CheckSeatLimitAsync(int userId)
    {
        var entitlement = await planLimits.GetEntitlementAsync(userId);
        var seats = entitlement.Plan.CaregiverSeats;

        var ownedBabyIds = await db.Babies.Where(b => b.UserId == userId).Select(b => b.Id).ToListAsync();
        var now = DateTime.UtcNow;

        var granted = await db.CaregiverAccess.CountAsync(a => ownedBabyIds.Contains(a.BabyId));
        var pending = await db.CaregiverInvites.CountAsync(i =>
            ownedBabyIds.Contains(i.BabyId)
            && i.Status == CaregiverInviteStatus.Pending
            && i.ExpiresAt > now);

        if (granted + pending >= seats)
        {
            return seats == 0
                ? new("plan", $"Your {entitlement.Plan.Name} plan doesn't include caregiver sharing. Upgrade to Family to invite caregivers.")
                : new("plan", $"Your {entitlement.Plan.Name} plan includes {seats} caregiver seats and they're all in use.");
        }

        return null;
    }

    private static string GenerateToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
}
