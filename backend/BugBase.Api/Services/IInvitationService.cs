using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IInvitationService
{
    Task<(ServiceResultStatus Status, InvitationResponseDto? Invitation)> SendAsync(SendInvitationDto dto, int senderId);
    Task<List<InvitationResponseDto>> GetPendingAsync(int userId);
    Task<List<int>> GetPendingUserIdsForProjectAsync(int projectId);
    Task<ServiceResultStatus> RespondAsync(int invitationId, int userId, bool accept);
}