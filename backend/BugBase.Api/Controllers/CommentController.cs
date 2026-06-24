using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController] [Route("api/[controller]")] [Authorize]
public class CommentController(ICommentService commentService) : ControllerBase
{
    private readonly ICommentService _commentService = commentService;

    [HttpGet]
    public async Task<ActionResult<List<CommentResponseDto>>> GetAllByIssueAsync ([FromQuery] int issueId)
    {    
        var comment = await _commentService.GetAllByIssueAsync(issueId);
        return Ok(comment);
    }

    [HttpPost]
    public async Task<ActionResult<CommentResponseDto>> CreateAsync(CreateCommentDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var comment = await _commentService.CreateAsync(userId, dto);
        return Created($"/api/comment/{comment.Id}", comment);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CommentResponseDto>> UpdateAsync(int id, UpdateCommentDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (status, comment) = await _commentService.UpdateAsync(id, dto, userId);
        if (status == ServiceResultStatus.NotFound) return NotFound();
        if (status == ServiceResultStatus.Forbidden) return Forbid();
        if (status == ServiceResultStatus.BadRequest) return BadRequest();
        return Ok(comment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var status = await _commentService.DeleteAsync(id, userId);
        if (status == ServiceResultStatus.NotFound) return NotFound();
        if (status == ServiceResultStatus.Forbidden) return Forbid();
        return NoContent();
    }
}