namespace BugBase.Api.Models;

// Junction table — links users to the projects they are members of.
// No own ID; the primary key is the combination of ProjectId + UserId (configured in AppDbContext).
public class ProjectMember
{
    public int ProjectId { get; set; } // FK → Projects
    public int UserId { get; set; }    // FK → Users

    // Reference navigations — each row belongs to exactly one project and one user
    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}