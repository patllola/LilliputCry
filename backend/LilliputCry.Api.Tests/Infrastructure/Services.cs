using CloudinaryDotNet;
using Microsoft.Extensions.Logging.Abstractions;
using TinyTrack.Api.Data;
using TinyTrack.Api.Features.Babies.Services;
using TinyTrack.Api.Features.Caregivers.Services;
using TinyTrack.Api.Features.Feeding.Services;
using TinyTrack.Api.Features.Medications.Services;
using TinyTrack.Api.Features.Milestones.Services;
using TinyTrack.Api.Features.Pump.Services;
using TinyTrack.Api.Features.Sleep.Services;
using TinyTrack.Api.Features.Subscriptions.Services;

namespace LilliputCry.Api.Tests.Infrastructure;

/// <summary>
/// Builds the real service graph over a test database — no mocks, so the tests exercise
/// the same access-scoping and plan-limit code paths production does.
/// </summary>
public static class Services
{
    public static BabyAccessService Access(AppDbContext db) => new(db);

    public static PlanLimitService PlanLimits(AppDbContext db) => new(db);

    public static BabyService Babies(AppDbContext db) => new(db, Access(db), PlanLimits(db));

    public static CaregiverService Caregivers(AppDbContext db) => new(db, Access(db), PlanLimits(db));

    public static SubscriptionService Subscriptions(AppDbContext db) => new(db, PlanLimits(db));

    public static FeedingLogService Feeding(AppDbContext db) => new(db, Babies(db), PlanLimits(db));

    public static SleepLogService Sleep(AppDbContext db) => new(db, Babies(db), PlanLimits(db));

    public static PumpSessionService Pump(AppDbContext db) => new(db, Babies(db), PlanLimits(db));

    public static MedicationService Medications(AppDbContext db) => new(db, Babies(db));

    /// <summary>
    /// Milestones with a Cloudinary client pointed at dummy credentials. Only the code paths
    /// that never reach Cloudinary are covered — reads, and writes rejected before upload.
    /// </summary>
    public static MilestoneService Milestones(AppDbContext db) => new(
        db,
        new Cloudinary(new Account("test-cloud", "test-key", "test-secret")),
        NullLogger<MilestoneService>.Instance,
        Babies(db),
        PlanLimits(db));
}
