using BugBase.Api.Models;

namespace BugBase.Api.DTOs;


public class CreateIssueDto
{
    public int ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IssuePriority Priority { get; set; }
    public int? AssignedTo { get; set; } // Optional — an issue doesn't have to be assigned immediately
}

public class UpdateIssueDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public IssueStatus? Status { get; set; }
    public IssuePriority? Priority { get; set; }
    public int? AssignedTo { get; set; }
}

public class IssueResponseDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string ReportedByName { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt  { get; set; }
}