namespace BugBase.Api.DTOs;

public record RegisterDto(string Username, string Email, string Password);

public record LoginDto(string Email, string Password);

public record UpdateProfileDto(string? Username, string? Email, string? Password, string? Role, string? CurrentPassword, string? Color);

public record AuthResponseDto(string Token, string Username, string Role, string Email, int? CurrentProjectId, string Color);

public record SetCurrentProjectDto(int? ProjectId);
