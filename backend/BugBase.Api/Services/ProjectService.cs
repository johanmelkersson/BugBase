using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProjectResponseDto>> GetAllAsync()
    {
        var projects = await _context.Projects.ToListAsync();
        return projects.Select(p => new ProjectResponseDto
        {
            ProjectId = p.ProjectId,
            Name = p.Name,
            Description = p.Description,
            CreatedAt = p.CreatedAt,
            CreatedBy = p.CreatedBy
        });
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return null;

        return new ProjectResponseDto
        {
            ProjectId = project.ProjectId,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            CreatedBy = project.CreatedBy
        };
    }

    public async Task<ProjectResponseDto> CreateAsync(CreateProjectDto createProjectDto, int userId)
    {
        var project = new Project
        {
            Name = createProjectDto.Name,
            Description = createProjectDto.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return new ProjectResponseDto
        {
            ProjectId = project.ProjectId,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            CreatedBy = project.CreatedBy
        };
    }

    public async Task<ProjectResponseDto?> UpdateAsync(int id, UpdateProjectDto updateProjectDto)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return null;

        if (updateProjectDto.Name != null)
            project.Name = updateProjectDto.Name;

        if (updateProjectDto.Description != null)
            project.Description = updateProjectDto.Description;

        await _context.SaveChangesAsync();

        return new ProjectResponseDto
        {
            ProjectId = project.ProjectId,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            CreatedBy = project.CreatedBy
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return true;
    }
}