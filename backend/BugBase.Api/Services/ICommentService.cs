using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface ICommentService
{
    Task<List<CommentResponseDto>> GetAllByIssueAsync(int issueId);
    Task<CommentResponseDto> CreateAsync(int userId, CreateCommentDto dto);
    Task<(ServiceResultStatus Status, CommentResponseDto? Comment)> UpdateAsync(int id, UpdateCommentDto dto, int userId);
    Task<ServiceResultStatus> DeleteAsync(int commentId, int userId);
}