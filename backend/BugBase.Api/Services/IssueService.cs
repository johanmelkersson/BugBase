using Microsoft.EntityFrameworkCore;

using BugBase.Api.DTOs;
using BugBase.Api.Data;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class IssueService : IIssueService
{
    private readonly AppDbContext _context;

    public IssueService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IssueResponseDto>> GetAllAsync()
    {
        var issues = await _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .ToListAsync();

        return issues.Select(i => new IssueResponseDto
        {
            IssueId =           i.IssueId,
            ProjectId =         i.ProjectId,
            Title =             i.Title,
            Description =       i.Description,
            Status =            i.Status.ToString(),
            Priority =          i.Priority.ToString(),
            CreatedAt =         i.CreatedAt,
            UpdatedAt =         i.UpdatedAt,
            ReportedByName =    $"{i.ReportedByUser.FirstName} {i.ReportedByUser.LastName}",
            AssignedToName =    i.AssignedToUser != null ? $"{i.AssignedToUser.FirstName} {i.AssignedToUser.LastName}" : null
        });
    }

    public async Task<IssueResponseDto?> GetByIdAsync(int id)
    {
        var issue = await _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .FirstOrDefaultAsync(i => i.IssueId == id);

        if (issue == null) return null;

        return new IssueResponseDto
        {
            IssueId =           issue.IssueId,
            ProjectId =         issue.ProjectId,
            Title =             issue.Title,
            Description =       issue.Description,
            Status =            issue.Status.ToString(),
            Priority =          issue.Priority.ToString(),
            CreatedAt =         issue.CreatedAt,
            UpdatedAt =         issue.UpdatedAt,
            ReportedByName =    $"{issue.ReportedByUser.FirstName} {issue.ReportedByUser.LastName}",
            AssignedToName =    issue.AssignedToUser != null ? $"{issue.AssignedToUser.FirstName} {issue.AssignedToUser.LastName}" : null
        };
    }

    public async  Task<IssueResponseDto> CreateAsync(CreateIssueDto createIssueDto, int userId)
    {
        var issue = new Issue
        {
            ProjectId =     createIssueDto.ProjectId,
            ReportedBy =    userId,
            AssignedTo =    createIssueDto.AssignedTo,
            Title =         createIssueDto.Title,
            Description =   createIssueDto.Description,
            Status =        IssueStatus.Open,
            Priority =      createIssueDto.Priority,
            CreatedAt =     DateTime.UtcNow,
            UpdatedAt =     DateTime.UtcNow
        };

        _context.Issues.Add(issue);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(issue.IssueId) ?? throw new Exception("Issue not found after creation");
    }

    public async Task<IssueResponseDto?> UpdateAsync(int id, UpdateIssueDto updateIssueDto)
    {
        var issue = await _context.Issues
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToUser)
            .FirstOrDefaultAsync(i => i.IssueId == id);

        if (issue == null) return null;

        if (updateIssueDto.Title != null) issue.Title = updateIssueDto.Title;
        if (updateIssueDto.Description != null) issue.Description = updateIssueDto.Description;
        if (updateIssueDto.Status != null) issue.Status = updateIssueDto.Status.Value;
        if (updateIssueDto.Priority != null) issue.Priority = updateIssueDto.Priority.Value;
        if (updateIssueDto.AssignedTo != null) issue.AssignedTo = updateIssueDto.AssignedTo;
        issue.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new IssueResponseDto
        {
            IssueId =           issue.IssueId,
            ProjectId =         issue.ProjectId,
            Title =             issue.Title,
            Description =       issue.Description,
            Status =            issue.Status.ToString(),
            Priority =          issue.Priority.ToString(),
            CreatedAt =         issue.CreatedAt,
            UpdatedAt =         issue.UpdatedAt,
            ReportedByName =    $"{issue.ReportedByUser.FirstName} {issue.ReportedByUser.LastName}",
            AssignedToName =    issue.AssignedToUser != null ? $"{issue.AssignedToUser.FirstName} {issue.AssignedToUser.LastName}" : null
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var issue = await _context.Issues.FindAsync(id);
        if (issue == null) return false;

        _context.Issues.Remove(issue);
        await _context.SaveChangesAsync();
        return true;
    }
}