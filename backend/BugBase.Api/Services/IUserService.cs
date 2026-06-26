using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IUserService
{
    Task<AuthResponseDto?> GetMeAsync(int userId);
    Task<List<UserResponseDto>> GetAllAsync();
    Task<List<UserResponseDto>> SearchByUsernameAsync(string username);
    Task<UserResponseDto?> UpdateRoleAsync(int id, UpdateUserRoleDto dto);
    Task<(ServiceResultStatus Status, AuthResponseDto? Response)> UpdateProfileAsync(int userId, UpdateProfileDto dto);
    Task<ServiceResultStatus> SetCurrentProjectAsync(int userId, int? projectId);
    Task<ServiceResultStatus> DeleteAccountAsync(int userId);
}