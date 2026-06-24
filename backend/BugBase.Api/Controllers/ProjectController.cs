using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController(IProjectService projectService) : ControllerBase
{
    private readonly IProjectService _projectService = projectService;

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var projects = await _projectService.GetAllAsync(userId);
        return Ok(projects);
    }

    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllAdminAsync()
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role)!;
        if (userRole != "Admin") return Forbid();
        var projects = await _projectService.GetAllAdminAsync();
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetMembers(int id)
    {
        var members = await _projectService.GetMembersAsync(id);
        return Ok(members);
    }

    [HttpGet("{id}/myrole")]
    public async Task<IActionResult> GetMyRoleAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = await _projectService.GetMyRoleAsync(id, userId);
        if (role == null) return NotFound();
        return Ok(new { role });
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CreateProjectDto createProjectDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var project = await _projectService.CreateAsync(createProjectDto, userId);
        return Created($"/api/project/{project.Id}", project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateProjectDto updateProjectDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (status, project) = await _projectService.UpdateAsync(id, updateProjectDto, userId);
        return status switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => Forbid(),
            _ => Ok(project)
        };
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMemberAsync(int id, int userId)
    {
        var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _projectService.RemoveMemberAsync(id, userId, requesterId);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    [HttpPut("{id}/members/{userId}")]
    public async Task<IActionResult> UpdateMemberRoleAsync(int id, int userId, [FromBody] UpdateMemberRoleDto dto)
    {
        var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _projectService.UpdateMemberRoleAsync(id, userId, dto.Role, requesterId);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => Forbid(),
            ServiceResultStatus.BadRequest => BadRequest(),
            _ => NoContent()
        };
    }

    [HttpDelete("{id}/leave")]
    public async Task<IActionResult> LeaveAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _projectService.LeaveAsync(id, userId);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => BadRequest("Owner cannot leave the project."),
            _ => NoContent()
        };
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue(ClaimTypes.Role)!;
        var result = await _projectService.DeleteAsync(id, userId, userRole);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => Forbid(),
            _ => NoContent()
        };
    }
}

