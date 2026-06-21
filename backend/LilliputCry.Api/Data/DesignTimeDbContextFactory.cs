using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TinyTrack.Api.Data;

/// <summary>
/// Used only by EF Core CLI tools (migrations / database update) at design time.
/// Builds the DbContext directly from configuration so the full app host
/// (Cloudinary, etc.) is never constructed — avoids requiring runtime-only secrets.
/// Must mirror the runtime options in Program.cs (snake_case naming).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("Neon")
            ?? throw new InvalidOperationException(
                "Connection string 'Neon' not found. Set ConnectionStrings:Neon in appsettings.Development.json.");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new AppDbContext(options);
    }
}
