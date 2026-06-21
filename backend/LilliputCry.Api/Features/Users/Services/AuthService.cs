using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Users.DTOs;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Features.Users.Services;

public class AuthService(AppDbContext dbContext, IConfiguration configuration)
{
    public async Task<(AuthResponseDto? response, string? error)> RegisterAsync(RegisterRequestDto input)
    {
        var existingUser = await dbContext.Users.FirstOrDefaultAsync(x =>
            x.Email == input.Email ||
            (x.PhoneNumber != null && x.PhoneNumber == input.PhoneNumber && x.FullName == input.FullName));

        if (existingUser != null)
        {
            if (existingUser.Email == input.Email)
                return (null, "email_already_exists");
            return (null, "user_already_exists_with_this_name_and_phone");
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            FullName = input.FullName,
            Email = input.Email,
            PhoneNumber = input.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.Password),
            Role = UserRole.User,
            SubscriptionStatus = SubscriptionStatus.Trial,
            TrialStartedAt = now,
            TrialEndsAt = now.AddDays(30)
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return (new AuthResponseDto(MapToProfileDto(user), GenerateToken(user)), null);
    }

    public async Task<(AuthResponseDto? response, string? error)> LoginAsync(LoginRequestDto input)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == input.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
            return (null, "invalid_credentials");

        return (new AuthResponseDto(MapToProfileDto(user), GenerateToken(user)), null);
    }

    public async Task<(AuthResponseDto? response, string? error)> GoogleSignInAsync(GoogleSignInRequestDto input)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { configuration["Google:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(input.IdToken, settings);
        }
        catch
        {
            return (null, "invalid_google_token");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == payload.Email);

        if (user == null)
        {
            var now = DateTime.UtcNow;
            user = new User
            {
                FullName = payload.Name ?? payload.Email,
                Email = payload.Email,
                ProfilePictureUrl = payload.Picture,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                Role = UserRole.User,
                SubscriptionStatus = SubscriptionStatus.Trial,
                TrialStartedAt = now,
                TrialEndsAt = now.AddDays(30)
            };
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }
        else if (payload.Picture != null && user.ProfilePictureUrl != payload.Picture)
        {
            user.ProfilePictureUrl = payload.Picture;
            user.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }

        return (new AuthResponseDto(MapToProfileDto(user), GenerateToken(user)), null);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddDays(int.Parse(configuration["Jwt:ExpiryDays"] ?? "30"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("guid", user.GuidId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    internal static UserProfileResponseDto MapToProfileDto(User user) =>
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
            user.CreatedAt,
            user.Role.ToString(),
            user.SubscriptionStatus.ToString(),
            user.TrialEndsAt,
            user.SubscriptionExpiresAt
        );
}
