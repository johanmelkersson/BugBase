using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController] [Route("api/[controller]")] [Authorize]
public class IssueController : ControllerBase
{
    private readonly IIssueService _issueService;

    public IssueController(IIssueService issueService)
    {
        _issueService = issueService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IssueResponseDto>>> GetAllAsync()
    {
        var issues = await _issueService.GetAllAsync();
        return Ok(issues);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IssueResponseDto>> GetByIdAsync(int id)
    {
        var issue = await _issueService.GetByIdAsync(id);
        if (issue == null) return NotFound();
        return Ok(issue);
    }

    [HttpPost]
    public async Task<ActionResult<IssueResponseDto>> CreateAsync(CreateIssueDto createIssueDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var issue = await _issueService.CreateAsync(createIssueDto, userId);
        return Created($"/api/issue/{issue.IssueId}", issue);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IssueResponseDto>> UpdateAsync(int id, UpdateIssueDto updateIssueDto)
    {
        var issue = await _issueService.UpdateAsync(id, updateIssueDto);
        if (issue == null) return NotFound();
        return Ok(issue);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var deletedIssue = await _issueService.DeleteAsync(id);
        if (!deletedIssue) return NotFound();
        return NoContent();
    }
}