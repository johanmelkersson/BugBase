using BugBase.Api.Models;

namespace BugBase.Api.DTOs;

public record CreateIssueDto(int ProjectId, string Title, string Description, IssuePriority Priority, IssueStatus Status, int? AssignedTo);

public record UpdateIssueDto(string? Title, string? Description, IssueStatus? Status, IssuePriority? Priority, int? AssignedTo, bool ClearAssignee = false);

public record IssueResponseDto(int Id, int ProjectId, string Title, string Description, string Status, string Priority, int? ReportedById, string? ReportedByName, string? AssignedToName, string? UpdatedByName, DateTime CreatedAt, DateTime UpdatedAt);
