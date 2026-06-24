namespace BugBase.Api.DTOs;

public record CreateProjectDto(string Name, string Description);

public record UpdateProjectDto(string? Name, string? Description);

public record ProjectResponseDto(int Id, string Name, string Description, DateTime CreatedAt, int CreatedBy);

public record ProjectMemberDto(int Id, string Username, string Role);

public record UpdateMemberRoleDto(string Role);
