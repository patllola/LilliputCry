using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Users.Services;

public class UserService(AppDbContext dbContext)
{
    public async Task<UserProfileResponseDto?> GetProfileAsync(Guid guidId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.GuidId == guidId);
        return user == null ? null : MapToDto(user);
    }

    public async Task<(UserProfileResponseDto? dto, string? error)> UpdateProfileAsync(Guid guidId, UpdateUserProfileDto input)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.GuidId == guidId);
        if (user == null)
        {
            return (null, "not_found");
        }

        // Check if another user already has this Email OR (FullName + PhoneNumber)
        var duplicate = await dbContext.Users.FirstOrDefaultAsync(x => 
            x.GuidId != guidId && (
                x.Email == input.Email || 
                (x.PhoneNumber != null && x.PhoneNumber == input.PhoneNumber && x.FullName == input.FullName)
            ));

        if (duplicate != null)
        {
            if (duplicate.Email == input.Email)
            {
                return (null, "email_already_exists");
            }
            return (null, "user_already_exists_with_this_name_and_phone");
        }

        user.FullName = input.FullName;
        user.Email = input.Email;
        user.ProfilePictureUrl = input.ProfilePictureUrl;
        user.PhoneNumber = input.PhoneNumber;
        user.Country = input.Country;
        user.State = input.State;
        user.City = input.City;
        user.Gender = input.Gender;
        user.Address = input.Address;
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return (MapToDto(user), null);
    }

    private static UserProfileResponseDto MapToDto(User user) =>
        new(
            user.Id,
            user.GuidId, 
            user.FullName, 
            user.Email, 
            user.ProfilePictureUrl, 
            user.PhoneNumber, 
            user.Country, 
            user.State, 
            user.City, 
            user.Gender, 
            user.Address, 
            user.CreatedAt
        );
}
