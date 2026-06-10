
// Tracks the lifecycle of an issue: Open → InProgress → Review → Closed
// Stored as a string in the database (configured in AppDbContext) for readability
public enum IssueStatus
{
    Open,
    InProgress,
    Review,
    Closed
}

// Stored as a string in the database (configured in AppDbContext)
public enum IssuePriority
{
    Low,
    Medium,
    High,
    Critical
}

// Represents a bug report or task within a project
public class Issue
{
    public int IssueId { get; set; }
    public int ProjectId { get; set; }  // FK → Projects
    public int ReportedBy { get; set; } // FK → Users (the user who filed the issue)
    public int? AssignedTo { get; set; } // FK → Users (nullable — issue may be unassigned)
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IssueStatus Status { get; set; }
    public IssuePriority Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Reference navigations
    // Note: two FKs to the same table (Users) — requires explicit Fluent API config in AppDbContext
    public Project Project { get; set; }
    public User ReportedByUser { get; set; }
    public User? AssignedToUser { get; set; } // Nullable — matches AssignedTo (int?)

    // Collection navigation
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}