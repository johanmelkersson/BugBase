
using BugBase.Api.Models;

namespace BugBase.Api.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role  { get; set; } = string.Empty;
}

public class UpdateUserRoleDto
{
    public UserRole Role  { get; set; }
}