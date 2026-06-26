using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class NotificationService(AppDbContext context) : INotificationService
{
    private readonly AppDbContext _context = context;

    public async Task<List<NotificationDto>> GetUnreadAsync(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(n.NotificationId, n.Type.ToString(), n.Message, n.ReferenceId, n.ProjectId, n.IsRead, n.CreatedAt))
            .ToListAsync();
    }

    public async Task MarkReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);
        if (notification == null) return;
        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        foreach (var n in notifications)
            n.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task CreateAsync(int userId, string type, string message, int? referenceId = null, int? projectId = null)
    {
        if (!Enum.TryParse<NotificationType>(type, out var notificationType)) return;
        _context.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = notificationType,
            Message = message,
            ReferenceId = referenceId,
            ProjectId = projectId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}
