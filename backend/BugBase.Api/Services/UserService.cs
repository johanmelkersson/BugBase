using Microsoft.EntityFrameworkCore;

using BugBase.Api.Data;
using BugBase.Api.DTOs;
using BugBase.Api.Models;

namespace BugBase.Api.Services;

public class UserService(AppDbContext context) : IUserService
{
    private readonly AppDbContext _context = context;

    public async Task<List<UserResponseDto>> GetAllAsync()
    {
        var users = await _context.Users.ToListAsync();
        return [.. users.Select(u => new UserResponseDto
        {
            Id =            u.UserId,
            Username =      u.Username,
            Email =         u.Email,
            Role =          u.Role.ToString()

        })];
    }



    public async Task<UserResponseDto?> UpdateRoleAsync(int id, UpdateUserRoleDto updateUserDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;
  
        user.Role = updateUserDto.Role;

        await _context.SaveChangesAsync();

        return new UserResponseDto
        {
            Id =            user.UserId,
            Username =      user.Username,
            Email =         user.Email,
            Role =          user.Role.ToString()
        };
    }
}