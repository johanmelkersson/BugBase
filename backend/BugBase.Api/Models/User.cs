namespace BugBase.Api.Models;

// Defines the three access levels in BugBase
public enum UserRole
{
    Admin,      // Full access — manage users, projects, and issues
    Developer,  // Can be assigned to issues and update their status
    Reporter    // Can create and comment on issues
}

// Represents a registered user in the system
public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // Stored as a bcrypt hash, never plaintext
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }

    // Collection navigations — used by EF Core to load related data via .Include()
    public ICollection<Project> CreatedProjects { get; set; } = new List<Project>();
    public ICollection<Issue> ReportedIssues { get; set; } = new List<Issue>();   // Issues this user filed
    public ICollection<Issue> AssignedIssues { get; set; } = new List<Issue>();   // Issues assigned to this user
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
}