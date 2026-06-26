using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController(IUserService userService) : ControllerBase
{
    private readonly IUserService _userService = userService;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllAsync()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMeAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userService.GetMeAsync(userId);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchAsync([FromQuery] string username)
    {
        var users = await _userService.SearchByUsernameAsync(username);
        return Ok(users);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserRoleDto updateUserRoleDto)
    {
        var updatedUser = await _userService.UpdateRoleAsync(id, updateUserRoleDto);
        if (updatedUser == null) return NotFound();
        return Ok(updatedUser);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfileAsync([FromBody] UpdateProfileDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (status, response) = await _userService.UpdateProfileAsync(userId, dto);
        return status switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            ServiceResultStatus.Forbidden => Forbid(),
            _ => Ok(response)
        };
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUserAsync(int id)
    {
        var result = await _userService.DeleteAccountAsync(id);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            _ => NoContent()
        };
    }

    [HttpPut("current-project")]
    public async Task<IActionResult> SetCurrentProjectAsync([FromBody] SetCurrentProjectDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _userService.SetCurrentProjectAsync(userId, dto.ProjectId);
        return result == ServiceResultStatus.NotFound ? NotFound() : NoContent();
    }

    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteAccountAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _userService.DeleteAccountAsync(userId);
        return result switch
        {
            ServiceResultStatus.NotFound => NotFound(),
            _ => NoContent()
        };
    }
}

