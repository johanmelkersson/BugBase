using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController] [Route("api/[controller]")] [Authorize]
public class IssueController(IIssueService issueService) : ControllerBase
{
    private readonly IIssueService _issueService = issueService;

    [HttpGet]
    public async Task<ActionResult<List<IssueResponseDto>>> GetAllAsync([FromQuery] int? projectId)
    {    
        var issues = await _issueService.GetAllAsync(projectId);
        return Ok(issues);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IssueDetailDto>> GetByIdAsync(int id)
    {
        var issue = await _issueService.GetDetailAsync(id);
        if (issue == null) return NotFound();
        return Ok(issue);
    }

    [HttpPost]
    public async Task<ActionResult<IssueResponseDto>> CreateAsync(CreateIssueDto createIssueDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var issue = await _issueService.CreateAsync(createIssueDto, userId);
        return Created($"/api/issue/{issue.Id}", issue);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IssueResponseDto>> UpdateAsync(int id, UpdateIssueDto updateIssueDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (status, issue) = await _issueService.UpdateAsync(id, updateIssueDto, userId);
        if (status == ServiceResultStatus.NotFound) return NotFound();
        if (status == ServiceResultStatus.Forbidden) return Forbid();
        return Ok(issue);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var status = await _issueService.DeleteAsync(id, userId);
        if (status == ServiceResultStatus.NotFound) return NotFound();
        if (status == ServiceResultStatus.Forbidden) return Forbid();
        return NoContent();
    }
}