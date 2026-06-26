using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class ProjectService(AppDbContext context) : IProjectService
{
    private readonly AppDbContext _context = context;

    public async Task<List<ProjectResponseDto>> GetAllAsync(int userId)
    {
        var projects = await _context.Projects
            .Where(p => p.ProjectMembers.Any(pm => pm.UserId == userId))
            .ToListAsync();

        return [.. projects.Select(p => new ProjectResponseDto(p.ProjectId, p.Name, p.Description, p.CreatedAt, p.CreatedBy))];
    }

    public async Task<List<ProjectResponseDto>> GetAllAdminAsync()
    {
        var projects = await _context.Projects.ToListAsync();
        return [.. projects.Select(p => new ProjectResponseDto(p.ProjectId, p.Name, p.Description, p.CreatedAt, p.CreatedBy))];
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return null;

        return new ProjectResponseDto(project.ProjectId, project.Name, project.Description, project.CreatedAt, project.CreatedBy);
    }

    public async Task<List<ProjectMemberDto>> GetMembersAsync(int projectId)
    {
        return await _context.ProjectMembers
            .Where(pm => pm.ProjectId == projectId)
            .Include(pm => pm.User)
            .Select(pm => new ProjectMemberDto(pm.User.UserId, pm.User.Username, pm.Role.ToString(), pm.User.Color))
            .ToListAsync();
    }

    public async Task<string?> GetMyRoleAsync(int projectId, int userId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
        return member?.Role.ToString();
    }

    public async Task<ProjectResponseDto> CreateAsync(CreateProjectDto createProjectDto, int userId)
    {
        var project = new Project
        {
            Name = createProjectDto.Name,
            Description = createProjectDto.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            ProjectMembers = new List<ProjectMember>
            {
                new() { UserId = userId, Role = ProjectMemberRole.Owner }
            }
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return new ProjectResponseDto(project.ProjectId, project.Name, project.Description, project.CreatedAt, project.CreatedBy);
    }

    public async Task<(ServiceResultStatus Status, ProjectResponseDto? Project)> UpdateAsync(int id, UpdateProjectDto updateProjectDto, int userId)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return (ServiceResultStatus.NotFound, null);

        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);
        if (member == null || member.Role != ProjectMemberRole.Owner)
            return (ServiceResultStatus.Forbidden, null);

        if (updateProjectDto.Name != null) project.Name = updateProjectDto.Name;
        if (updateProjectDto.Description != null) project.Description = updateProjectDto.Description;

        await _context.SaveChangesAsync();

        return (ServiceResultStatus.Success, new ProjectResponseDto(project.ProjectId, project.Name, project.Description, project.CreatedAt, project.CreatedBy));
    }

    public async Task<ServiceResultStatus> LeaveAsync(int projectId, int userId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

        if (member == null) return ServiceResultStatus.NotFound;
        if (member.Role == ProjectMemberRole.Owner) return ServiceResultStatus.Forbidden;

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }

    public async Task<ServiceResultStatus> RemoveMemberAsync(int projectId, int targetUserId, int requesterId)
    {
        var requesterMember = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == requesterId);
        if (requesterMember == null || requesterMember.Role != ProjectMemberRole.Owner)
            return ServiceResultStatus.Forbidden;

        var target = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == targetUserId);
        if (target == null) return ServiceResultStatus.NotFound;
        if (target.Role == ProjectMemberRole.Owner) return ServiceResultStatus.Forbidden;

        _context.ProjectMembers.Remove(target);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }

    public async Task<ServiceResultStatus> UpdateMemberRoleAsync(int projectId, int targetUserId, string newRole, int requesterId)
    {
        if (!Enum.TryParse<ProjectMemberRole>(newRole, out var role))
            return ServiceResultStatus.BadRequest;

        var requesterMember = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == requesterId);
        if (requesterMember == null || requesterMember.Role != ProjectMemberRole.Owner)
            return ServiceResultStatus.Forbidden;

        var target = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == targetUserId);
        if (target == null) return ServiceResultStatus.NotFound;

        target.Role = role;

        if (role == ProjectMemberRole.Reporter)
        {
            var assignedIssues = await _context.Issues
                .Where(i => i.ProjectId == projectId && i.AssignedTo == targetUserId)
                .ToListAsync();
            foreach (var issue in assignedIssues)
                issue.AssignedTo = null;
        }

        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }

    public async Task<ServiceResultStatus> DeleteAsync(int id, int userId, string userRole)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return ServiceResultStatus.NotFound;

        if (userRole != "Admin")
        {
            var member = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);

            if (member == null || member.Role != ProjectMemberRole.Owner)
                return ServiceResultStatus.Forbidden;
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}