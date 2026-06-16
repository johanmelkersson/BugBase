namespace BugBase.Api.DTOs;
using BugBase.Api.Models;

public class CreateIssueDto
{
    public int ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IssuePriority Priority { get; set; }
    public int? AssignedTo { get; set; } // Optional — an issue doesn't have to be assigned immediately
}