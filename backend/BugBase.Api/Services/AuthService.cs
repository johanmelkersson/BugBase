using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    private readonly AppDbContext _context = context;
    private readonly IConfiguration _configuration = configuration;

    private static readonly string[] AvatarColors = [
        "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
        "#f97316", "#eab308", "#22c55e", "#10b981", "#14b8a6",
        "#06b6d4", "#3b82f6"
    ];

    public string GenerateToken(User user) => GenerateJwtToken(user);

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            throw new Exception("Email already in use.");

        var user = new User
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
            Role = await _context.Users.AnyAsync() ? UserRole.User : UserRole.Admin,
            Color = AvatarColors[Random.Shared.Next(AvatarColors.Length)],
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthResponseDto(token, user.Username, user.Role.ToString(), user.Email, null, user.Color);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            throw new Exception("Invalid email or password.");

        var token = GenerateJwtToken(user);
        return new AuthResponseDto(token, user.Username, user.Role.ToString(), user.Email, user.CurrentProjectId, user.Color);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
