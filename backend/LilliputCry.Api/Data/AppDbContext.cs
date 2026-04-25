using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Features.Feeding.Models;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<FeedingLog> FeedingLogs => Set<FeedingLog>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.Email).IsUnique();
        });

        builder.Entity<FeedingLog>(e =>
        {
            e.ToTable("feeding_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.MilkPrepared).HasColumnType("numeric(6,1)");
            e.Property(x => x.MilkFed).HasColumnType("numeric(6,1)");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.FedAt).HasDatabaseName("idx_feeding_logs_fed_at");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<FeedingLog>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}
