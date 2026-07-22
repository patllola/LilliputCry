using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Milestones.DTOs;
using TinyTrack.Api.Features.Milestones.Models;

namespace TinyTrack.Api.Features.Milestones.Services;

public class MilestoneService(AppDbContext db, Cloudinary cloudinary, ILogger<MilestoneService> logger, BabyService babyService)
{
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public async Task<List<MilestoneResponseDto>> GetAllAsync(int userId, int? babyId = null, int page = 1, int pageSize = 50) =>
        await db.Milestones
            .Include(x => x.Baby)
            .Where(x => x.UserId == userId && (babyId == null || x.BabyId == babyId))
            .OrderByDescending(x => x.AchievedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync();

    public async Task<MilestoneResponseDto?> GetByIdAsync(Guid guidId, int userId)
    {
        var m = await db.Milestones
            .Include(x => x.Baby)
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .FirstOrDefaultAsync();
        return m is null ? null : ToDto(m);
    }

    public async Task<(MilestoneResponseDto? dto, ValidationError? error)> CreateAsync(CreateMilestoneDto input, int userId)
    {
        var imageError = ValidateImage(input.Image);
        if (imageError is not null) return (null, imageError);

        if (input.AchievedAt > DateTime.UtcNow.AddMinutes(5))
            return (null, new("achievedAt", "Cannot be in the future"));

        var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
        if (babyError is not null) return (null, babyError);

        var uploadResult = await UploadToCloudinaryAsync(input.Image, userId);
        if (uploadResult is null)
            return (null, new("image", "Image upload failed. Try again."));

        var milestone = new Milestone
        {
            UserId = userId,
            BabyId = babyIntId,
            AchievedAt = DateTime.SpecifyKind(input.AchievedAt, DateTimeKind.Utc),
            Note = input.Note,
            ImageUrl = uploadResult.SecureUrl.ToString(),
            ImagePublicId = uploadResult.PublicId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Milestones.Add(milestone);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(milestone.GuidId, userId), null);
    }

    public async Task<(MilestoneResponseDto? dto, string? notFound, ValidationError? error)> UpdateAsync(Guid guidId, UpdateMilestoneDto input, int userId)
    {
        var milestone = await db.Milestones.FirstOrDefaultAsync(x => x.GuidId == guidId && x.UserId == userId);
        if (milestone is null) return (null, "not_found", null);

        if (input.BabyId is not null)
        {
            var (babyIntId, babyError) = await babyService.ResolveBabyIdAsync(input.BabyId, userId);
            if (babyError is not null) return (null, null, babyError);
            milestone.BabyId = babyIntId;
        }

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

            // Delete old image from Cloudinary then upload new
            await cloudinary.DestroyAsync(new DeletionParams(milestone.ImagePublicId));

            var uploadResult = await UploadToCloudinaryAsync(input.Image, userId);
            if (uploadResult is null)
                return (null, null, new("image", "Image upload failed. Try again."));

            milestone.ImageUrl = uploadResult.SecureUrl.ToString();
            milestone.ImagePublicId = uploadResult.PublicId;
        }

        await db.SaveChangesAsync();
        return (await GetByIdAsync(guidId, userId), null, null);
    }

    public async Task<bool> DeleteAsync(Guid guidId, int userId)
    {
        var milestone = await db.Milestones
            .Where(x => x.GuidId == guidId && x.UserId == userId)
            .FirstOrDefaultAsync();

        if (milestone is null) return false;

        await cloudinary.DestroyAsync(new DeletionParams(milestone.ImagePublicId));
        db.Milestones.Remove(milestone);
        await db.SaveChangesAsync();
        return true;
    }

    private async Task<ImageUploadResult?> UploadToCloudinaryAsync(IFormFile file, int userId)
    {
        await using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"lilliputcry/milestones/user_{userId}",
            Transformation = new Transformation().Quality("auto").FetchFormat("auto"),
            Overwrite = false
        };

        var result = await cloudinary.UploadAsync(uploadParams);
        if (result.Error is not null)
        {
            logger.LogError("Cloudinary upload failed for user {UserId}: {Error}", userId, result.Error.Message);
            return null;
        }
        return result;
    }

    private static ValidationError? ValidateImage(IFormFile file)
    {
        if (file.Length == 0) return new("image", "Image cannot be empty");
        if (file.Length > MaxImageBytes) return new("image", "Image must be under 5 MB");
        if (!AllowedContentTypes.Contains(file.ContentType))
            return new("image", "Only JPEG, PNG, WebP, and GIF images are allowed");
        return null;
    }

    private static MilestoneResponseDto ToDto(Milestone m) => new(
        m.Id,
        m.GuidId,
        m.Baby != null ? m.Baby.GuidId : null,
        m.AchievedAt,
        m.Note,
        m.ImageUrl,
        m.CreatedAt,
        m.UpdatedAt
    );
}
