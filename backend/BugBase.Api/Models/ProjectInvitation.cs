namespace BugBase.Api.Models;

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined
}

public class ProjectInvitation
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int InvitedUserId { get; set; }
    public int InvitedByUserId { get; set; }
    public ProjectMemberRole Role { get; set; }
    public InvitationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public Project Project { get; set; } = null!;
    public User InvitedUser { get; set; } = null!;
    public User InvitedByUser { get; set; } = null!;
}