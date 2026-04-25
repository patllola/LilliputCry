using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Users.Services;

public class AuthService(AppDbContext dbContext)
{
    public async Task<(AuthResponseDto? response, string? error)> RegisterAsync(RegisterRequestDto input)
    {
        var existingUser = await dbContext.Users.FirstOrDefaultAsync(x => 
            x.Email == input.Email || 
            (x.PhoneNumber != null && x.PhoneNumber == input.PhoneNumber && x.FullName == input.FullName));

        if (existingUser != null)
        {
            if (existingUser.Email == input.Email)
            {
                return (null, "email_already_exists");
            }
            
            return (null, "user_already_exists_with_this_name_and_phone");
        }

        var user = new User
        {
            FullName = input.FullName,
            Email = input.Email,
            PhoneNumber = input.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.Password)
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return (new AuthResponseDto(MapToProfileDto(user)), null);
    }

    public async Task<(AuthResponseDto? response, string? error)> LoginAsync(LoginRequestDto input)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == input.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
        {
            return (null, "invalid_credentials");
        }

        return (new AuthResponseDto(MapToProfileDto(user)), null);
    }

    private static UserProfileResponseDto MapToProfileDto(User user) =>
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
