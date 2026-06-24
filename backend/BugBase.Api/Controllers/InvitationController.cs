using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

using BugBase.Api.Services;
using BugBase.Api.DTOs;

namespace BugBase.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvitationController(IInvitationService invitationService) : ControllerBase
{
    private readonly IInvitationService _invitationService = invitationService;

    [HttpPost]
    public async Task<IActionResult> SendAsync([FromBody] SendInvitationDto dto)
    {
        var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (status, invitation) = await _invitationService.SendAsync(dto, senderId);
        return status switch
        {
            ServiceResultStatus.Forbidden => Forbid(),
            ServiceResultStatus.BadRequest => BadRequest("Invalid invitation."),
            _ => Created($"/api/invitation/{invitation!.Id}", invitation)
        };
    }

    [HttpGet("project/{projectId}/pending-users")]
    public async Task<IActionResult> GetPendingUsersAsync(int projectId)
    {
        var ids = await _invitationService.GetPendingUserIdsForProjectAsync(projectId);
        return Ok(ids);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var invitations = await _invitationService.GetPendingAsync(userId);
        return Ok(invitations);
    }

    [HttpPut("{id}/accept")]
    public async Task<IActionResult> AcceptAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _invitationService.RespondAsync(id, userId, accept: true);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.BadRequest => BadRequest("Invitation is no longer pending."),
            _ => NoContent()
        };
    }

    [HttpPut("{id}/decline")]
    public async Task<IActionResult> DeclineAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _invitationService.RespondAsync(id, userId, accept: false);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.BadRequest => BadRequest("Invitation is no longer pending."),
            _ => NoContent()
        };
    }
}