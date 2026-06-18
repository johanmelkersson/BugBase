namespace BugBase.Api.DTOs;

public class CreateCommentDto
{
    public int IssueId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class UpdateCommentDto
{
    public string? Content { get; set; }
}

public class CommentResponseDto
{
    public int Id { get; set; }
    public int IssueId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}