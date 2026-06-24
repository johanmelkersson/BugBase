using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class UserService(AppDbContext context, IAuthService authService) : IUserService
{
    private readonly AppDbContext _context = context;
    private readonly IAuthService _authService = authService;

    public async Task<List<UserResponseDto>> GetAllAsync()
    {
        var users = await _context.Users.ToListAsync();
        return [.. users.Select(u => new UserResponseDto(u.UserId, u.Username, u.Email, u.Role.ToString()))];
    }

    public async Task<List<UserResponseDto>> SearchByUsernameAsync(string username)
    {
        var users = await _context.Users
            .Where(u => u.Username.ToLower().Contains(username.ToLower()))
            .Take(10)
            .ToListAsync();

        return [.. users.Select(u => new UserResponseDto(u.UserId, u.Username, u.Email, u.Role.ToString()))];
    }

    public async Task<UserResponseDto?> UpdateRoleAsync(int id, UpdateUserRoleDto updateUserDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        user.Role = updateUserDto.Role;

        await _context.SaveChangesAsync();

        return new UserResponseDto(user.UserId, user.Username, user.Email, user.Role.ToString());
    }

    public async Task<(ServiceResultStatus Status, AuthResponseDto? Response)> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (ServiceResultStatus.NotFound, null);

        if (dto.Username != null) user.Username = dto.Username;
        if (dto.Email != null) user.Email = dto.Email;
        if (dto.Password != null)
        {
            if (dto.CurrentPassword == null || !BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return (ServiceResultStatus.Forbidden, null);
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }
        if (dto.Role != null && Enum.TryParse<UserRole>(dto.Role, out var role)) user.Role = role;

        await _context.SaveChangesAsync();

        var token = _authService.GenerateToken(user);
        return (ServiceResultStatus.Success, new AuthResponseDto(token, user.Username, user.Role.ToString(), user.Email, user.CurrentProjectId));
    }

    public async Task<ServiceResultStatus> SetCurrentProjectAsync(int userId, int? projectId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return ServiceResultStatus.NotFound;
        user.CurrentProjectId = projectId;
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }

    public async Task<ServiceResultStatus> DeleteAccountAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return ServiceResultStatus.NotFound;

        // Remove invitations (Restrict FK — must be deleted manually)
        var invitations = await _context.ProjectInvitations
            .Where(i => i.InvitedUserId == userId || i.InvitedByUserId == userId)
            .ToListAsync();
        _context.ProjectInvitations.RemoveRange(invitations);


        // Delete projects owned by this user (cascades to issues, comments, members)
        var ownedProjects = await _context.ProjectMembers
            .Where(pm => pm.UserId == userId && pm.Role == ProjectMemberRole.Owner)
            .Select(pm => pm.ProjectId)
            .ToListAsync();
        var projects = await _context.Projects
            .Where(p => ownedProjects.Contains(p.ProjectId))
            .ToListAsync();
        _context.Projects.RemoveRange(projects);

        await _context.SaveChangesAsync();

        // Re-fetch user after cascades have run
        var freshUser = await _context.Users.FindAsync(userId);
        if (freshUser != null) _context.Users.Remove(freshUser);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}
