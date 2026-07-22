using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.DTOs;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Feeding.Services;

namespace TinyTrack.Api.Features.Babies.Services;

public class BabyService(AppDbContext db)
{
    public async Task<List<BabyResponseDto>> GetAllAsync(int userId) =>
        await db.Babies
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => ToDto(x))
            .ToListAsync();

    public async Task<BabyResponseDto?> GetByIdAsync(Guid guidId, int userId) =>
        await db.Babies
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .Select(x => ToDto(x))
            .FirstOrDefaultAsync();

    public async Task<(BabyResponseDto? dto, ValidationError? error)> CreateAsync(CreateBabyDto input, int userId)
    {
        var error = Validate(input.Name, input.DateOfBirth);
        if (error is not null) return (null, error);

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
        return (ToDto(baby), null);
    }

    public async Task<(BabyResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateBabyDto input, int userId)
    {
        var baby = await db.Babies.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (baby is null) return (null, "not_found", null);

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
        return (ToDto(baby), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.Babies
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    /// Resolves a public baby Guid to its internal int Id, scoped to the owning user.
    public async Task<(int? id, ValidationError? error)> ResolveBabyIdAsync(Guid? babyGuidId, int userId)
    {
        if (babyGuidId is null) return (null, null);
        var id = await db.Babies
            .Where(b => b.GuidId == babyGuidId && b.UserId == userId)
            .Select(b => (int?)b.Id)
            .FirstOrDefaultAsync();
        return id is null ? (null, new ValidationError("babyId", "Baby not found")) : (id, null);
    }

    private static ValidationError? Validate(string name, DateTime dateOfBirth)
    {
        if (string.IsNullOrWhiteSpace(name)) return new("name", "Name is required");
        if (dateOfBirth > DateTime.UtcNow.AddMinutes(5)) return new("dateOfBirth", "Cannot be in the future");
        return null;
    }

    private static BabyResponseDto ToDto(Baby x) => new(
        x.Id,
        x.GuidId,
        x.Name,
        x.AvatarColor,
        x.DateOfBirth,
        x.WeightKg,
        x.HeightCm,
        x.CreatedAt,
        x.UpdatedAt
    );
}
