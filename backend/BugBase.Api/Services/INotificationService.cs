using BugBase.Api.DTOs;

namespace BugBase.Api.Services;

public interface INotificationService
{
    Task<List<NotificationDto>> GetUnreadAsync(int userId);
    Task MarkReadAsync(int notificationId, int userId);
    Task MarkAllReadAsync(int userId);
    Task CreateAsync(int userId, string type, string message, int? referenceId = null, int? projectId = null);
}
