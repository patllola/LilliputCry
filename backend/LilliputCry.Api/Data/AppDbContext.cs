using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Features.Feeding.Models;
using TinyTrack.Api.Features.Milestones.Models;
using TinyTrack.Api.Features.Pump.Models;
using TinyTrack.Api.Features.Sleep.Model;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<FeedingLog> FeedingLogs => Set<FeedingLog>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<PumpSession> PumpSessions => Set<PumpSession>();
    public DbSet<SleepingLog> SleepLogs => Set<SleepingLog>();
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
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.SubscriptionStatus).HasConversion<string>().HasMaxLength(20);
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
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Milestone>(e =>
        {
            e.ToTable("milestones");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Note).HasMaxLength(500);
            e.Property(x => x.ImageContentType).HasMaxLength(100);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.AchievedAt).HasDatabaseName("idx_milestones_achieved_at");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SleepingLog>(e =>
        {
            e.ToTable("sleep_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.SleepStart).HasDatabaseName("idx_sleep_logs_sleep_start");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PumpSession>(e =>
        {
            e.ToTable("pump_sessions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.LeftAmount).HasColumnType("numeric(6,1)");
            e.Property(x => x.RightAmount).HasColumnType("numeric(6,1)");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.PumpedAt).HasDatabaseName("idx_pump_sessions_pumped_at");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<FeedingLog>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<PumpSession>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<SleepingLog>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<Milestone>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}
