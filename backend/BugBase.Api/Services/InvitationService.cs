using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class InvitationService(AppDbContext context, INotificationService notificationService) : IInvitationService
{
    private readonly AppDbContext _context = context;
    private readonly INotificationService _notifications = notificationService;

    public async Task<(ServiceResultStatus Status, InvitationResponseDto? Invitation)> SendAsync(SendInvitationDto dto, int senderId)
    {
        var senderMember = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == dto.ProjectId && pm.UserId == senderId);

        if (senderMember == null || senderMember.Role != ProjectMemberRole.Owner)
            return (ServiceResultStatus.Forbidden, null);

        var alreadyMember = await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == dto.ProjectId && pm.UserId == dto.InvitedUserId);

        if (alreadyMember)
            return (ServiceResultStatus.BadRequest, null);

        var alreadyPending = await _context.ProjectInvitations
            .AnyAsync(i => i.ProjectId == dto.ProjectId && i.InvitedUserId == dto.InvitedUserId && i.Status == InvitationStatus.Pending);

        if (alreadyPending)
            return (ServiceResultStatus.BadRequest, null);

        if (!Enum.TryParse<ProjectMemberRole>(dto.Role, out var role))
            return (ServiceResultStatus.BadRequest, null);

        var invitation = new ProjectInvitation
        {
            ProjectId =       dto.ProjectId,
            InvitedUserId =   dto.InvitedUserId,
            InvitedByUserId = senderId,
            Role =            role,
            Status =          InvitationStatus.Pending,
            CreatedAt =       DateTime.UtcNow
        };

        _context.ProjectInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        var project = await _context.Projects.FindAsync(dto.ProjectId);
        var sender = await _context.Users.FindAsync(senderId);

        await _notifications.CreateAsync(
            dto.InvitedUserId,
            "Invitation",
            $"{sender!.Username} invited you to join {project!.Name}",
            invitation.Id);

        return (ServiceResultStatus.Success, new InvitationResponseDto(
            invitation.Id, invitation.ProjectId, project!.Name, sender!.Username,
            invitation.Role.ToString(), invitation.Status.ToString(), invitation.CreatedAt));
    }

    public async Task<List<InvitationResponseDto>> GetPendingAsync(int userId)
    {
        var invitations = await _context.ProjectInvitations
            .Include(i => i.Project)
            .Include(i => i.InvitedByUser)
            .Where(i => i.InvitedUserId == userId && i.Status == InvitationStatus.Pending)
            .ToListAsync();

        return [.. invitations.Select(i => new InvitationResponseDto(
            i.Id, i.ProjectId, i.Project.Name, i.InvitedByUser.Username,
            i.Role.ToString(), i.Status.ToString(), i.CreatedAt))];
    }

    public async Task<List<int>> GetPendingUserIdsForProjectAsync(int projectId)
    {
        return await _context.ProjectInvitations
            .Where(i => i.ProjectId == projectId && i.Status == InvitationStatus.Pending)
            .Select(i => i.InvitedUserId)
            .ToListAsync();
    }

    public async Task<ServiceResultStatus> RespondAsync(int invitationId, int userId, bool accept)
    {
        var invitation = await _context.ProjectInvitations
            .FirstOrDefaultAsync(i => i.Id == invitationId && i.InvitedUserId == userId);

        if (invitation == null) return ServiceResultStatus.NotFound;
        if (invitation.Status != InvitationStatus.Pending) return ServiceResultStatus.BadRequest;

        if (accept)
        {
            invitation.Status = InvitationStatus.Accepted;
            _context.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = invitation.ProjectId,
                UserId =    userId,
                Role =      invitation.Role
            });
        }
        else
        {
            invitation.Status = InvitationStatus.Declined;
        }

        await _context.SaveChangesAsync();
        return ServiceResultStatus.Success;
    }
}
