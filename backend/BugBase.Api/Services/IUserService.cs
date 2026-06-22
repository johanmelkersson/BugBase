using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IUserService
{
    Task<List<UserResponseDto >> GetAllAsync();
    Task<UserResponseDto?> UpdateRoleAsync(int id, UpdateUserRoleDto dto);
}