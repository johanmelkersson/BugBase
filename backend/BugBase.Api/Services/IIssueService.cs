using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface IIssueService
{
    Task<IEnumerable<IssueResponseDto>> GetAllAsync();
    Task<IssueResponseDto?> GetByIdAsync(int id);
    Task<IssueResponseDto> CreateAsync(CreateIssueDto createIssueDto, int userId);
    Task<IssueResponseDto?> UpdateAsync(int id, UpdateIssueDto updateIssueDto);
    Task<bool> DeleteAsync(int id);
}