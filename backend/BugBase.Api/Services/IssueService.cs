using Microsoft.EntityFrameworkCore;

using BugBase.Api.DTOs;
using BugBase.Api.Data;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class IssueService(AppDbContext context) : IIssueService
{
    private readonly AppDbContext _context = context;

    public async Task<List<IssueResponseDto>> GetAllAsync(int? projectId)
    {
        IQueryable<Issue> query = _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .Include(i => i.UpdatedByUser);

        if (projectId.HasValue)
            query = query.Where(i => i.ProjectId == projectId.Value);

        var issues = await query.ToListAsync();

        return [.. issues.Select(i => new IssueResponseDto(
            i.IssueId, i.ProjectId, i.Title, i.Description,
            i.Status.ToString(), i.Priority.ToString(),
            i.ReportedBy, i.ReportedByUser?.Username, i.AssignedToUser?.Username,
            i.UpdatedByUser?.Username, i.CreatedAt, i.UpdatedAt))];
    }

    public async Task<IssueResponseDto?> GetByIdAsync(int id)
    {
        var issue = await _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .Include(i => i.UpdatedByUser)
            .FirstOrDefaultAsync(i => i.IssueId == id);

        if (issue == null) return null;

        return new IssueResponseDto(
            issue.IssueId, issue.ProjectId, issue.Title, issue.Description,
            issue.Status.ToString(), issue.Priority.ToString(),
            issue.ReportedBy, issue.ReportedByUser?.Username, issue.AssignedToUser?.Username,
            issue.UpdatedByUser?.Username, issue.CreatedAt, issue.UpdatedAt);
    }

    private async Task<ProjectMemberRole?> GetProjectRoleAsync(int userId, int projectId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.UserId == userId && pm.ProjectId == projectId);
        return member?.Role;
    }

    public async Task<IssueResponseDto> CreateAsync(CreateIssueDto createIssueDto, int userId)
    {
        var issue = new Issue
        {
            ProjectId = createIssueDto.ProjectId,
            ReportedBy = userId,
            AssignedTo = createIssueDto.AssignedTo,
            Title = createIssueDto.Title,
            Description = createIssueDto.Description,
            Status = createIssueDto.Status,
            Priority = createIssueDto.Priority,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Issues.Add(issue);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(issue.IssueId) ?? throw new Exception("Issue not found after creation");
    }

    public async Task<(ServiceResultStatus Status, IssueResponseDto? Issue)> UpdateAsync(int id, UpdateIssueDto updateIssueDto, int userId)
    {
        var issue = await _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .FirstOrDefaultAsync(i => i.IssueId == id);

        if (issue == null)
            return (ServiceResultStatus.NotFound, null);

        var projectRole = await GetProjectRoleAsync(userId, issue.ProjectId);
        if (projectRole == ProjectMemberRole.Reporter && issue.ReportedBy != userId)
            return (ServiceResultStatus.Forbidden, null);

        if (updateIssueDto.Title != null) issue.Title = updateIssueDto.Title;
        if (updateIssueDto.Description != null) issue.Description = updateIssueDto.Description;
        if (updateIssueDto.Status != null) issue.Status = updateIssueDto.Status.Value;
        if (updateIssueDto.Priority != null) issue.Priority = updateIssueDto.Priority.Value;
        if (updateIssueDto.ClearAssignee) issue.AssignedTo = null;
        else if (updateIssueDto.AssignedTo != null) issue.AssignedTo = updateIssueDto.AssignedTo;
        issue.UpdatedAt = DateTime.UtcNow;
        issue.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return (ServiceResultStatus.Success, await GetByIdAsync(issue.IssueId));
    }

    public async Task<ServiceResultStatus> DeleteAsync(int id, int userId)
    {
        var issue = await _context.Issues.FindAsync(id);

        if (issue == null)
            return ServiceResultStatus.NotFound;

        var projectRole = await GetProjectRoleAsync(userId, issue.ProjectId);
        if (projectRole == null)
            return ServiceResultStatus.Forbidden;
        if (projectRole == ProjectMemberRole.Reporter && issue.ReportedBy != userId)
            return ServiceResultStatus.Forbidden;

        _context.Issues.Remove(issue);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}
