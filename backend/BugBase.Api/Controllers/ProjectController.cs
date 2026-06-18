using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController][Route("api/[controller]")][Authorize]
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        var projects = await _projectService.GetAllAsync();
        return Ok(projects);
    }
 
    [HttpGet("{id}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPost][Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateProjectDto createProjectDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var project = await _projectService.CreateAsync(createProjectDto, userId);
        return Created($"/api/project/{project.ProjectId}", project);
    }

    [HttpPut("{id}")][Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateProjectDto updateProjectDto)
    {
        var updatedProject = await _projectService.UpdateAsync(id, updateProjectDto);
        if (updatedProject == null) return NotFound();
        return Ok(updatedProject);
    }

    [HttpDelete("{id}")][Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var deletedProject = await _projectService.DeleteAsync(id);
        if (!deletedProject) return NotFound();
        return NoContent();
    }
}

