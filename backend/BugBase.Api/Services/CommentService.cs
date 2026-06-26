using Microsoft.EntityFrameworkCore;

using BugBase.Api.DTOs;
using BugBase.Api.Data;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class CommentService(AppDbContext context, INotificationService notificationService) : ICommentService
{
    private readonly AppDbContext _context = context;
    private readonly INotificationService _notifications = notificationService;

    public async Task<List<CommentResponseDto>> GetAllByIssueAsync(int issueId)
    {
        var comments = await _context.Comments
           .Include(c => c.User)
           .Where(c => c.IssueId == issueId)
           .ToListAsync();

        return [.. comments.Select(c => new CommentResponseDto(
            c.CommentId, c.IssueId, c.Content, c.UserId, c.User?.Username, c.CreatedAt, c.UpdatedAt))];
    }

    private async Task<CommentResponseDto?> GetByIdAsync(int id)
    {
        var comment = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.CommentId == id);

        if (comment == null) return null;

        return new CommentResponseDto(
            comment.CommentId, comment.IssueId, comment.Content, comment.UserId, comment.User?.Username,
            comment.CreatedAt, comment.UpdatedAt);
    }

    private async Task<ProjectMemberRole?> GetProjectRoleAsync(int userId, int projectId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.UserId == userId && pm.ProjectId == projectId);
        return member?.Role;
    }

    public async Task<CommentResponseDto> CreateAsync(int userId, CreateCommentDto dto)
    {
        var comment = new Comment
        {
            IssueId = dto.IssueId,
            UserId = userId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var issue = await _context.Issues.FindAsync(dto.IssueId);
        var commenter = await _context.Users.FindAsync(userId);

        if (issue != null && commenter != null)
        {
            var shortContent = dto.Content.Length > 60 ? dto.Content[..60] + "…" : dto.Content;
            var message = $"{commenter.Username} commented on \"{issue.Title}\": {shortContent}";

            var notifyIds = new HashSet<int>();
            if (issue.ReportedBy.HasValue && issue.ReportedBy.Value != userId)
                notifyIds.Add(issue.ReportedBy.Value);
            if (issue.AssignedTo.HasValue && issue.AssignedTo.Value != userId)
                notifyIds.Add(issue.AssignedTo.Value);

            foreach (var recipientId in notifyIds)
                await _notifications.CreateAsync(recipientId, "IssueComment", message, issue.IssueId, issue.ProjectId);
        }

        return await GetByIdAsync(comment.CommentId) ?? throw new Exception("Comment not found after creation");
    }

    public async Task<(ServiceResultStatus Status, CommentResponseDto? Comment)> UpdateAsync(int id, UpdateCommentDto dto, int userId)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.CommentId == id);

        if (comment == null)
            return (ServiceResultStatus.NotFound, null);

        var issue = await _context.Issues.FindAsync(comment.IssueId);
        var projectRole = await GetProjectRoleAsync(userId, issue!.ProjectId);
        if (projectRole == null) return (ServiceResultStatus.Forbidden, null);
        if (projectRole != ProjectMemberRole.Owner && comment.UserId != userId)
            return (ServiceResultStatus.Forbidden, null);

        if (dto.Content == null)
            return (ServiceResultStatus.BadRequest, null);

        comment.Content = dto.Content;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var result = await GetByIdAsync(comment.CommentId) ?? throw new Exception("Comment not found after update");
        return (ServiceResultStatus.Success, result);
    }

    public async Task<ServiceResultStatus> DeleteAsync(int commentId, int userId)
    {
        var comment = await _context.Comments.FindAsync(commentId);

        if (comment == null)
            return ServiceResultStatus.NotFound;

        var issue = await _context.Issues.FindAsync(comment.IssueId);
        var projectRole = await GetProjectRoleAsync(userId, issue!.ProjectId);
        if (projectRole == null) return ServiceResultStatus.Forbidden;
        if (projectRole != ProjectMemberRole.Owner && comment.UserId != userId)
            return ServiceResultStatus.Forbidden;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}
