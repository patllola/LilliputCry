using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Models;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Feeding.Models;
using TinyTrack.Api.Features.Medications.Models;
using TinyTrack.Api.Features.Milestones.Models;
using TinyTrack.Api.Features.Pump.Models;
using TinyTrack.Api.Features.Sleep.Model;
using TinyTrack.Api.Features.Subscriptions.Models;
using TinyTrack.Api.Features.Users.Models;

namespace LilliputCry.Api.Tests.Infrastructure;

/// <summary>Builders for the entities the service tests need. Every field a test might
/// assert on is settable; the rest get sane defaults so tests stay readable.</summary>
public static class TestData
{
    /// <summary>
    /// Defaults to a paid-up Family user, so tests exercise plan *limits* rather than
    /// expiry. Pass <c>planExpiresAt</c> to test a specific expiry, or <c>paidUp: false</c>
    /// for someone who picked a paid tier but never paid for it.
    /// </summary>
    public static User AddUser(
        this AppDbContext db,
        string email = "owner@example.com",
        string fullName = "Test Owner",
        UserRole role = UserRole.User,
        PlanTier plan = PlanTier.Family,
        BillingCycle billing = BillingCycle.Monthly,
        DateTime? planExpiresAt = null,
        bool paidUp = true)
    {
        var now = DateTime.UtcNow;

        // Free never carries an expiry; a paid tier gets one only if it's been paid for.
        DateTime? expiry = plan == PlanTier.Free || !paidUp
            ? null
            : planExpiresAt ?? now.AddYears(1);

        var user = new User
        {
            GuidId = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            PasswordHash = "not-a-real-hash",
            Role = role,
            PlanTier = plan,
            BillingCycle = billing,
            PlanExpiresAt = planExpiresAt ?? expiry,
            PlanSelectedAt = plan == PlanTier.Free ? null : now,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    public static Baby AddBaby(this AppDbContext db, int userId, string name = "Ava", string color = "#ff6fa5")
    {
        var now = DateTime.UtcNow;
        var baby = new Baby
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            AvatarColor = color,
            DateOfBirth = now.AddMonths(-6),
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Babies.Add(baby);
        db.SaveChanges();
        return baby;
    }

    public static CaregiverAccess GrantAccess(
        this AppDbContext db, int babyId, int userId, CaregiverRole role, int grantedBy = 1)
    {
        var now = DateTime.UtcNow;
        var grant = new CaregiverAccess
        {
            GuidId = Guid.NewGuid(),
            BabyId = babyId,
            UserId = userId,
            GrantedByUserId = grantedBy,
            Role = role,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.CaregiverAccess.Add(grant);
        db.SaveChanges();
        return grant;
    }

    public static CaregiverInvite AddInvite(
        this AppDbContext db,
        int babyId,
        int invitedByUserId,
        string email,
        CaregiverRole role = CaregiverRole.Log,
        string? token = null,
        CaregiverInviteStatus status = CaregiverInviteStatus.Pending,
        DateTime? expiresAt = null)
    {
        var now = DateTime.UtcNow;
        var invite = new CaregiverInvite
        {
            GuidId = Guid.NewGuid(),
            BabyId = babyId,
            InvitedByUserId = invitedByUserId,
            Email = email.ToLowerInvariant(),
            Role = role,
            Token = token ?? Guid.NewGuid().ToString("N"),
            Status = status,
            ExpiresAt = expiresAt ?? now.AddDays(14),
            CreatedAt = now,
            UpdatedAt = now
        };
        db.CaregiverInvites.Add(invite);
        db.SaveChanges();
        return invite;
    }

    public static FeedingLog AddFeedingLog(
        this AppDbContext db, int userId, int? babyId, DateTime? fedAt = null,
        decimal prepared = 100m, decimal fed = 80m)
    {
        var now = DateTime.UtcNow;
        var log = new FeedingLog
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            BabyId = babyId,
            FedAt = fedAt ?? now,
            MilkPrepared = prepared,
            MilkFed = fed,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.FeedingLogs.Add(log);
        db.SaveChanges();
        return log;
    }

    public static SleepingLog AddSleepLog(
        this AppDbContext db, int userId, int? babyId, DateTime? start = null, double hours = 2)
    {
        var now = DateTime.UtcNow;
        var s = start ?? now.AddHours(-hours);
        var log = new SleepingLog
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            BabyId = babyId,
            SleepStart = s,
            SleepEnd = s.AddHours(hours),
            CreatedAt = now,
            UpdatedAt = now
        };
        db.SleepLogs.Add(log);
        db.SaveChanges();
        return log;
    }

    public static PumpSession AddPumpSession(
        this AppDbContext db, int userId, int? babyId, DateTime? pumpedAt = null,
        decimal left = 60m, decimal right = 40m)
    {
        var now = DateTime.UtcNow;
        var session = new PumpSession
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            BabyId = babyId,
            PumpedAt = pumpedAt ?? now,
            LeftAmount = left,
            RightAmount = right,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.PumpSessions.Add(session);
        db.SaveChanges();
        return session;
    }

    public static Medication AddMedication(
        this AppDbContext db, int userId, int? babyId, string name = "Vitamin D",
        string timeOfDay = "08:00", bool isDoneToday = false, DateOnly? lastToggled = null)
    {
        var now = DateTime.UtcNow;
        var medication = new Medication
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            BabyId = babyId,
            Name = name,
            TimeOfDay = timeOfDay,
            RepeatDaily = true,
            ReminderEnabled = true,
            IsDoneToday = isDoneToday,
            LastToggledDate = lastToggled,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Medications.Add(medication);
        db.SaveChanges();
        return medication;
    }

    public static Milestone AddMilestone(
        this AppDbContext db, int userId, int? babyId, DateTime? achievedAt = null, string note = "First smile")
    {
        var now = DateTime.UtcNow;
        var milestone = new Milestone
        {
            GuidId = Guid.NewGuid(),
            UserId = userId,
            BabyId = babyId,
            AchievedAt = achievedAt ?? now,
            Note = note,
            ImageUrl = "https://example.invalid/image.jpg",
            ImagePublicId = "test/public-id",
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Milestones.Add(milestone);
        db.SaveChanges();
        return milestone;
    }
}
