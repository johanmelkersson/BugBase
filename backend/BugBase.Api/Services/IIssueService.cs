using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IIssueService
{
    Task<List<IssueResponseDto>> GetAllAsync(int? projectID);
    Task<IssueResponseDto?> GetByIdAsync(int id);
    Task<IssueDetailDto?> GetDetailAsync(int id);
    Task<IssueResponseDto> CreateAsync(CreateIssueDto createIssueDto, int userId);
    Task<(ServiceResultStatus Status, IssueResponseDto? Issue)> UpdateAsync(int id, UpdateIssueDto updateIssueDto, int userId);
    Task<ServiceResultStatus> DeleteAsync(int id, int userId);
}