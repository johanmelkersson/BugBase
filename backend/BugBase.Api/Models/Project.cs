namespace BugBase.Api.Models;

// Represents a project that groups related issues together
public class Project
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; } // FK → Users

    // Reference navigation — the user who created this project
    public User CreatedByUser { get; set; } = null!;

    // Collection navigations
    public ICollection<Issue> CreatedIssues { get; set; } = new List<Issue>();
    public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>(); // Users with access
}