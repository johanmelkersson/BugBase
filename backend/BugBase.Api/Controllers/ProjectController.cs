using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController] [Route("api/[controller]")][Authorize]
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllProjectsAsync()
    {
        var projects = await _projectService.GetAllAsync();
        return Ok(projects);
    }
 
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectById (int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProjectAsync([FromBody] CreateProjectDto createProjectDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var project = await _projectService.CreateAsync(createProjectDto, userId);
        return CreatedAtAction(nameof(GetProjectById), new { id = project.ProjectId }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProjectAsync(int id, [FromBody] UpdateProjectDto updateProjectDto)
    {
        var updatedProject = await _projectService.UpdateAsync(id, updateProjectDto);
        if (updatedProject == null) return NotFound();
        return Ok(updatedProject);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProjectAsync(int id)
    {
        var deletedProject = await _projectService.DeleteAsync(id);
        if (!deletedProject) return NotFound();
        return NoContent();
    }

    // Implement API endpoints for projects here (e.g., GET /api/projects, POST /api/projects, etc.)
}

