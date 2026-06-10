using Microsoft.EntityFrameworkCore;
using BugBase.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- Services ---

builder.Services.AddControllers();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Enables OpenAPI/Swagger endpoint for API documentation
builder.Services.AddOpenApi();

// Registers AppDbContext with the DI container using the PostgreSQL connection string from appsettings
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// --- Middleware pipeline ---

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers(); // Maps controller routes (e.g. /api/auth/register → AuthController.Register)

// Expose the OpenAPI spec only in development (not in production)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Redirect HTTP requests to HTTPS
app.UseHttpsRedirection();

app.Run();