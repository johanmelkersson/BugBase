namespace BugBase.Api.DTOs;

public record SendInvitationDto(int ProjectId, int InvitedUserId, string Role);

public record InvitationResponseDto(int Id, int ProjectId, string ProjectName, string InvitedByUsername, string Role, string Status, DateTime CreatedAt);
