namespace BugBase.Api.DTOs;

public record NotificationDto(
    int NotificationId,
    string Type,
    string Message,
    int? ReferenceId,
    int? ProjectId,
    bool IsRead,
    DateTime CreatedAt
);
