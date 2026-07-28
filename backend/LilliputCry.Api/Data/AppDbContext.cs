using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Models;
using TinyTrack.Api.Features.Medications.Models;
using TinyTrack.Api.Features.Milestones.Models;
using TinyTrack.Api.Features.Pump.Models;
using TinyTrack.Api.Features.Sleep.Model;
using TinyTrack.Api.Features.Users.Models;

namespace TinyTrack.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Baby> Babies => Set<Baby>();
    public DbSet<FeedingLog> FeedingLogs => Set<FeedingLog>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<PumpSession> PumpSessions => Set<PumpSession>();
    public DbSet<SleepingLog> SleepLogs => Set<SleepingLog>();
    public DbSet<User> Users => Set<User>();
    public DbSet<CaregiverAccess> CaregiverAccess => Set<CaregiverAccess>();
    public DbSet<CaregiverInvite> CaregiverInvites => Set<CaregiverInvite>();

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
            e.Property(x => x.PlanTier).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(20);
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
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Milestone>(e =>
        {
            e.ToTable("milestones");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Note).HasMaxLength(500);
            e.Property(x => x.ImageUrl).HasMaxLength(600);
            e.Property(x => x.ImagePublicId).HasMaxLength(300);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.AchievedAt).HasDatabaseName("idx_milestones_achieved_at");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.SetNull);
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
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.SetNull);
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
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Baby>(e =>
        {
            e.ToTable("babies");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.AvatarColor).HasMaxLength(10);
            e.Property(x => x.WeightKg).HasColumnType("numeric(5,2)");
            e.Property(x => x.HeightCm).HasColumnType("numeric(5,1)");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CaregiverAccess>(e =>
        {
            e.ToTable("caregiver_access");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            // One grant per person per baby — re-inviting updates the existing row.
            e.HasIndex(x => new { x.BabyId, x.UserId }).IsUnique();
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CaregiverInvite>(e =>
        {
            e.ToTable("caregiver_invites");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Email).HasMaxLength(255);
            e.Property(x => x.Token).HasMaxLength(64);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.Email).HasDatabaseName("idx_caregiver_invites_email");
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.InvitedBy)
             .WithMany()
             .HasForeignKey(x => x.InvitedByUserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Medication>(e =>
        {
            e.ToTable("medications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.Property(x => x.GuidId).HasDefaultValueSql("gen_random_uuid()");
            e.HasIndex(x => x.GuidId).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Dose).HasMaxLength(50);
            e.Property(x => x.TimeOfDay).HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Baby)
             .WithMany()
             .HasForeignKey(x => x.BabyId)
             .OnDelete(DeleteBehavior.SetNull);
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

        foreach (var entry in ChangeTracker.Entries<Baby>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<Medication>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<CaregiverAccess>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<CaregiverInvite>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}
