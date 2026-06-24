using Microsoft.EntityFrameworkCore;

using BugBase.Api.DTOs;
using BugBase.Api.Data;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class CommentService(AppDbContext context) : ICommentService
{
    private readonly AppDbContext _context = context;

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
        if (projectRole == null || comment.UserId != userId)
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
        if (projectRole == null || comment.UserId != userId)
            return ServiceResultStatus.Forbidden;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}
