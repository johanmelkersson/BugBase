namespace BugBase.Api.Models;

// Represents a comment posted on an issue
public class Comment
{
    public int CommentId { get; set; }
    public int IssueId { get; set; } // FK → Issues
    public int UserId { get; set; }  // FK → Users (the author)
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Reference navigations
    public Issue Issue { get; set; } = null!;
    public User User { get; set; } = null!;
}