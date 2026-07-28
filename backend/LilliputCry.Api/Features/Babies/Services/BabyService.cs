using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.DTOs;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Caregivers.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace TinyTrack.Api.Features.Babies.Services;

public class BabyService(AppDbContext db, BabyAccessService access, PlanLimitService planLimits)
{
    /// <summary>
    /// Babies the caller created plus any shared with them, owned first so the client's
    /// default active baby stays the user's own.
    /// </summary>
    public async Task<List<BabyResponseDto>> GetAllAsync(int userId)
    {
        var owned = await db.Babies
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => ToDto(x, CaregiverRole.Owner))
            .ToListAsync();

        var shared = await db.CaregiverAccess
            .Include(a => a.Baby)
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.CreatedAt)
            .Select(a => ToDto(a.Baby, a.Role))
            .ToListAsync();

        return [.. owned, .. shared];
    }

    public async Task<BabyResponseDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var baby = await db.Babies.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (baby is null) return null;

        var role = await access.GetRoleAsync(baby.Id, userId);
        return role is null ? null : ToDto(baby, role.Value);
    }

    public async Task<(BabyResponseDto? dto, ValidationError? error)> CreateAsync(CreateBabyDto input, int userId)
    {
        var error = Validate(input.Name, input.DateOfBirth);
        if (error is not null) return (null, error);

        // Plan cap counts only babies the user created — babies shared with them by
        // someone else sit on that person's plan, not theirs.
        var entitlement = await planLimits.GetEntitlementAsync(userId);
        if (entitlement.Plan.MaxBabies is { } maxBabies)
        {
            var owned = await db.Babies.CountAsync(x => x.UserId == userId);
            if (owned >= maxBabies)
                return (null, new("plan",
                    $"Your {entitlement.Plan.Name} plan covers {maxBabies} baby profile{(maxBabies == 1 ? "" : "s")}. Upgrade to add another."));
        }

        var baby = new Baby
        {
            UserId = userId,
            Name = input.Name,
            AvatarColor = input.AvatarColor,
            DateOfBirth = DateTime.SpecifyKind(input.DateOfBirth, DateTimeKind.Utc),
            WeightKg = input.WeightKg,
            HeightCm = input.HeightCm,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Babies.Add(baby);
        await db.SaveChangesAsync();
        return (ToDto(baby, CaregiverRole.Owner), null);
    }

    /// <summary>Editing the profile itself needs Full access — Log-only caregivers can't rename a baby.</summary>
    public async Task<(BabyResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateBabyDto input, int userId)
    {
        var baby = await db.Babies.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (baby is null) return (null, "not_found", null);

        var role = await access.GetRoleAsync(baby.Id, userId);
        if (role is null) return (null, "not_found", null);
        if (!role.Value.AtLeast(CaregiverRole.Full))
            return (null, null, new("babyId", "You do not have permission to edit this baby's profile"));

        var newName = input.Name ?? baby.Name;
        var newDob = input.DateOfBirth ?? baby.DateOfBirth;

        var error = Validate(newName, newDob);
        if (error is not null) return (null, null, error);

        baby.Name = newName;
        baby.AvatarColor = input.AvatarColor ?? baby.AvatarColor;
        baby.DateOfBirth = DateTime.SpecifyKind(newDob, DateTimeKind.Utc);
        baby.WeightKg = input.WeightKg ?? baby.WeightKg;
        baby.HeightCm = input.HeightCm ?? baby.HeightCm;

        await db.SaveChangesAsync();
        return (ToDto(baby, role.Value), null, null);
    }

    /// <summary>Only the creator can delete a baby; sharing never confers destruction rights.</summary>
    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.Babies
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    /// <inheritdoc cref="BabyAccessService.ResolveBabyIdAsync"/>
    public Task<(int? id, ValidationError? error)> ResolveBabyIdAsync(
        Guid? babyGuidId,
        int userId,
        CaregiverRole minRole = CaregiverRole.Read) =>
        access.ResolveBabyIdAsync(babyGuidId, userId, minRole);

    /// <inheritdoc cref="BabyAccessService.GetAccessibleBabyIdsAsync"/>
    public Task<List<int>> GetAccessibleBabyIdsAsync(int userId) =>
        access.GetAccessibleBabyIdsAsync(userId);

    /// <inheritdoc cref="BabyAccessService.CanModifyRecordAsync"/>
    public Task<bool> CanModifyRecordAsync(int? recordBabyId, int recordUserId, int userId) =>
        access.CanModifyRecordAsync(recordBabyId, recordUserId, userId);

    private static ValidationError? Validate(string name, DateTime dateOfBirth)
    {
        if (string.IsNullOrWhiteSpace(name)) return new("name", "Name is required");
        if (dateOfBirth > DateTime.UtcNow.AddMinutes(5)) return new("dateOfBirth", "Cannot be in the future");
        return null;
    }

    private static BabyResponseDto ToDto(Baby x, CaregiverRole role) => new(
        x.Id,
        x.GuidId,
        x.Name,
        x.AvatarColor,
        x.DateOfBirth,
        x.WeightKg,
        x.HeightCm,
        x.CreatedAt,
        x.UpdatedAt,
        role.ToWire()
    );
}
