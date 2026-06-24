using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    string GenerateToken(User user);
}