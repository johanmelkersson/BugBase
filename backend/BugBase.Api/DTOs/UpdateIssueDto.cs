namespace BugBase.Api.DTOs;
using BugBase.Api.Models;

public class UpdateIssueDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public IssueStatus? Status { get; set; }
    public IssuePriority? Priority { get; set; }
    public int? AssignedTo { get; set; }
}