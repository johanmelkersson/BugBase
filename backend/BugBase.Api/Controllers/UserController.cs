using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BugBase.Api.Services;
using BugBase.Api.DTOs;


namespace BugBase.Api.Controllers;

[ApiController][Route("api/[controller]")][Authorize(Roles = "Admin")]
public class UserController(IUserService userService) : ControllerBase
{
    private readonly IUserService _userService = userService;

    [HttpGet]
    public async Task<IActionResult> GetAllAsync()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }
 
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserRoleDto updateUserRoleDto)
    {
        var updatedUser = await _userService.UpdateRoleAsync(id, updateUserRoleDto);
        if (updatedUser == null) return NotFound();
        return Ok(updatedUser);
    }
}

