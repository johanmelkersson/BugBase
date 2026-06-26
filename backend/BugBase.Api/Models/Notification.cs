namespace BugBase.Api.Models;

public enum NotificationType
{
    Invitation,
    IssueAssigned,
    IssueComment
}

public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? ReferenceId { get; set; }
    public int? ProjectId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
