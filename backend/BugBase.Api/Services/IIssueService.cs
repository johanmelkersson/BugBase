using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IIssueService
{
    Task<IEnumerable<IssueResponseDto>> GetAllAsync(int? projectID);
    Task<IssueResponseDto?> GetByIdAsync(int id);
    Task<IssueResponseDto> CreateAsync(CreateIssueDto createIssueDto, int userId);
    Task<(ServiceResultStatus Status, IssueResponseDto? Issue)> UpdateAsync(int id, UpdateIssueDto updateIssueDto, int userId, string userRole);
    Task<ServiceResultStatus> DeleteAsync(int id, int userId, string userRole);
}