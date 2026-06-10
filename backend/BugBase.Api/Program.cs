using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services ---

// Enables OpenAPI/Swagger endpoint for API documentation
builder.Services.AddOpenApi();

// Registers AppDbContext with the DI container using the PostgreSQL connection string from appsettings
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// --- Middleware pipeline ---

// Expose the OpenAPI spec only in development (not in production)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Redirect HTTP requests to HTTPS
app.UseHttpsRedirection();

app.Run();