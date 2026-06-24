namespace BugBase.Api.DTOs;

public record CreateCommentDto(int IssueId, string Content);

public record UpdateCommentDto(string? Content);

public record CommentResponseDto(int Id, int IssueId, string Content, int? AuthorId, string? AuthorName, DateTime CreatedAt, DateTime UpdatedAt);
