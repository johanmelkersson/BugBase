using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectResponseDto>> GetAllAsync();
    Task<ProjectResponseDto?> GetByIdAsync(int id);
    Task<ProjectResponseDto> CreateAsync(CreateProjectDto createProjectDto, int userId);
    Task<ProjectResponseDto?> UpdateAsync(int id, UpdateProjectDto updateProjectDto);
    Task<bool> DeleteAsync(int id);
}