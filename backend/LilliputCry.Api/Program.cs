using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;
using TinyTrack.Api.Data;
using CloudinaryDotNet;
using TinyTrack.Api.Features.Admin.Services;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Medications.Services;
using TinyTrack.Api.Features.Milestones.Services;
using TinyTrack.Api.Features.Pump.Services;
using TinyTrack.Api.Features.Sleep.Services;
using TinyTrack.Api.Features.Users.Services;

if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")))
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Neon"))
       .UseSnakeCaseNamingConvention());

// Cloudinary
var cloudinaryAccount = new Account(
    builder.Configuration["Cloudinary:CloudName"],
    builder.Configuration["Cloudinary:ApiKey"],
    builder.Configuration["Cloudinary:ApiSecret"]);
builder.Services.AddSingleton(new Cloudinary(cloudinaryAccount) { Api = { Secure = true } });

// Controllers
builder.Services.AddControllers();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 6 * 1024 * 1024; // 6 MB hard limit (our service validates ≤5 MB)
});

// Services
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<BabyService>();
builder.Services.AddScoped<FeedingLogService>();
builder.Services.AddScoped<MedicationService>();
builder.Services.AddScoped<MilestoneService>();
builder.Services.AddScoped<PumpSessionService>();
builder.Services.AddScoped<SleepLogService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// CORS — allow Next.js dev server and production frontend
var allowedOrigin = builder.Configuration["AllowedOrigin"];
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
    {
        var origins = new List<string> { "http://localhost:3000" };
        if (!string.IsNullOrWhiteSpace(allowedOrigin))
            origins.Add(allowedOrigin);
        p.WithOrigins([.. origins])
         .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
         .WithHeaders("Content-Type", "Authorization");
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
    c.SwaggerDoc("v1", new() { Title = "LilliputCry API", Version = "v1", Description = "Baby feeding tracker API" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Apply pending migrations on startup
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "LilliputCry API v1"));

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithTags("Health");

var port = Environment.GetEnvironmentVariable("PORT") ?? "7000";
app.Run($"http://0.0.0.0:{port}");