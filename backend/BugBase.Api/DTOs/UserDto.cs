using BugBase.Api.Models;

namespace BugBase.Api.DTOs;

public record UserResponseDto(int Id, string Username, string Email, string Role, string Color);

public record UpdateUserRoleDto(UserRole Role);
