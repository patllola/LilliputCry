using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Milestones.DTOs;
using TinyTrack.Api.Features.Milestones.Models;

namespace TinyTrack.Api.Features.Milestones.Services;

public class MilestoneService(AppDbContext db)
{
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public async Task<List<MilestoneListDto>> GetAllAsync(int userId, int page = 1, int pageSize = 50) =>
        await db.Milestones
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.AchievedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MilestoneListDto(x.Id, x.GuidId, x.AchievedAt, x.Note, x.CreatedAt, x.UpdatedAt))
            .ToListAsync();

    public async Task<MilestoneDetailDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var m = await db.Milestones
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .FirstOrDefaultAsync();

        return m is null ? null : ToDetailDto(m);
    }

    public async Task<(byte[]? data, string? contentType)> GetImageAsync(Guid guidId, int userId)
    {
        var m = await db.Milestones
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .Select(x => new { x.ImageData, x.ImageContentType })
            .FirstOrDefaultAsync();

        return m is null ? (null, null) : (m.ImageData, m.ImageContentType);
    }

    public async Task<(MilestoneDetailDto? dto, ValidationError? error)> CreateAsync(CreateMilestoneDto input, int userId)
    {
        var imageError = ValidateImage(input.Image);
        if (imageError is not null) return (null, imageError);

        if (input.AchievedAt > DateTime.UtcNow.AddMinutes(5))
            return (null, new("achievedAt", "Cannot be in the future"));

        using var ms = new MemoryStream();
        await input.Image.CopyToAsync(ms);

        var milestone = new Milestone
        {
            UserId = userId,
            AchievedAt = DateTime.SpecifyKind(input.AchievedAt, DateTimeKind.Utc),
            Note = input.Note,
            ImageData = ms.ToArray(),
            ImageContentType = input.Image.ContentType,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Milestones.Add(milestone);
        await db.SaveChangesAsync();
        return (ToDetailDto(milestone), null);
    }

    public async Task<(MilestoneDetailDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateMilestoneDto input, int userId)
    {
        var milestone = await db.Milestones.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (milestone is null) return (null, "not_found", null);

        if (input.AchievedAt.HasValue)
        {
            if (input.AchievedAt.Value > DateTime.UtcNow.AddMinutes(5))
                return (null, null, new("achievedAt", "Cannot be in the future"));
            milestone.AchievedAt = DateTime.SpecifyKind(input.AchievedAt.Value, DateTimeKind.Utc);
        }

        if (input.Note is not null)
            milestone.Note = input.Note;

        if (input.Image is not null)
        {
            var imageError = ValidateImage(input.Image);
            if (imageError is not null) return (null, null, imageError);

            using var ms = new MemoryStream();
            await input.Image.CopyToAsync(ms);
            milestone.ImageData = ms.ToArray();
            milestone.ImageContentType = input.Image.ContentType;
        }

        await db.SaveChangesAsync();
        return (ToDetailDto(milestone), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var deleted = await db.Milestones
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    private static ValidationError? ValidateImage(IFormFile file)
    {
        if (file.Length == 0) return new("image", "Image cannot be empty");
        if (file.Length > MaxImageBytes) return new("image", "Image must be under 5 MB");
        if (!AllowedContentTypes.Contains(file.ContentType))
            return new("image", "Only JPEG, PNG, WebP, and GIF images are allowed");
        return null;
    }

    private static MilestoneDetailDto ToDetailDto(Milestone m) => new(
        m.Id,
        m.GuidId,
        m.AchievedAt,
        m.Note,
        $"data:{m.ImageContentType};base64,{Convert.ToBase64String(m.ImageData)}",
        m.CreatedAt,
        m.UpdatedAt
    );
}
