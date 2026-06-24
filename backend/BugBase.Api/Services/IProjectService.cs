using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IProjectService
{
    Task<List<ProjectResponseDto>> GetAllAsync(int userId);
    Task<List<ProjectResponseDto>> GetAllAdminAsync();
    Task<ProjectResponseDto?> GetByIdAsync(int id);
    Task<List<ProjectMemberDto>> GetMembersAsync(int projectId);
    Task<string?> GetMyRoleAsync(int projectId, int userId);
    Task<ProjectResponseDto> CreateAsync(CreateProjectDto createProjectDto, int userId);
    Task<(ServiceResultStatus Status, ProjectResponseDto? Project)> UpdateAsync(int id, UpdateProjectDto updateProjectDto, int userId);
    Task<ServiceResultStatus> LeaveAsync(int projectId, int userId);
    Task<ServiceResultStatus> DeleteAsync(int id, int userId, string userRole);
    Task<ServiceResultStatus> RemoveMemberAsync(int projectId, int targetUserId, int requesterId);
    Task<ServiceResultStatus> UpdateMemberRoleAsync(int projectId, int targetUserId, string newRole, int requesterId);
}