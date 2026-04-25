using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Users.Services;

if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")))
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Neon"))
       .UseSnakeCaseNamingConvention());

// Controllers
builder.Services.AddControllers();

// Services
builder.Services.AddScoped<FeedingLogService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();

// CORS — allow Next.js dev server and production frontend
var allowedOrigin = builder.Configuration["AllowedOrigin"];
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
    {
        var origins = new List<string> { "http://localhost:3000" };
        if (!string.IsNullOrWhiteSpace(allowedOrigin))
            origins.Add(allowedOrigin);
        p.WithOrigins([.. origins])
         .WithMethods("GET", "POST", "PUT", "DELETE")
         .WithHeaders("Content-Type");
    }));

// Rate limiting — 120 requests per minute per IP
builder.Services.AddRateLimiter(opt =>
{
    opt.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 120;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
    opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TinyTrack API", Version = "v1", Description = "Baby feeding tracker API" });
});

var app = builder.Build();

// Apply pending migrations on startup — wrapped so a migration failure doesn't crash the app
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        ctx.Database.Migrate();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed on startup");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TinyTrack API v1"));

app.UseCors();
app.UseRateLimiter();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithTags("Health");

app.Run("http://localhost:7000");
