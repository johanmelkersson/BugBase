using Microsoft.AspNetCore.Mvc;

using BugBase.Api.Services;
using BugBase.Api.DTOs;    // RegisterDto, LoginDto

namespace BugBase.Api.Controllers;

[ApiController] [Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{    
    private readonly IAuthService _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            var result = await _authService.RegisterAsync(registerDto);
            return Created("/api/auth/register", result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var result = await _authService.LoginAsync(loginDto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return Unauthorized(ex.Message);
        }
    }
}