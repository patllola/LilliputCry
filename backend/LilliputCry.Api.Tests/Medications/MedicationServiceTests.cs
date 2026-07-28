using LilliputCry.Api.Tests.Infrastructure;
using TinyTrack.Api.Features.Caregivers.Models;
using TinyTrack.Api.Features.Medications.DTOs;
using TinyTrack.Api.Features.Subscriptions.Models;
using Xunit;

namespace LilliputCry.Api.Tests.Medications;

public class MedicationServiceTests
{
    [Fact]
    public async Task Create_rejects_a_blank_name()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Medications(h.Db)
            .CreateAsync(new CreateMedicationDto("  ", null, "08:00", true, true, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("name", error!.Field);
    }

    [Fact]
    public async Task Create_rejects_a_blank_time_of_day()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();

        var (dto, error) = await Services.Medications(h.Db)
            .CreateAsync(new CreateMedicationDto("Vitamin D", null, "", true, true, null), user.Id);

        Assert.Null(dto);
        Assert.Equal("timeOfDay", error!.Field);
    }

    [Fact]
    public async Task Create_returns_the_baby_it_was_filed_under()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);

        var (dto, error) = await Services.Medications(h.Db)
            .CreateAsync(new CreateMedicationDto("Vitamin D", "5ml", "08:00", true, true, baby.GuidId), user.Id);

        Assert.Null(error);
        Assert.Equal(baby.GuidId, dto!.BabyId);
        Assert.Equal("5ml", dto.Dose);
    }

    [Fact]
    public async Task GetAll_is_ordered_by_time_of_day()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddMedication(user.Id, baby.Id, "Evening", "20:00");
        h.Db.AddMedication(user.Id, baby.Id, "Morning", "08:00");

        var list = await Services.Medications(h.Db).GetAllAsync(user.Id, baby.Id);

        Assert.Equal("Morning", list[0].Name);
        Assert.Equal("Evening", list[1].Name);
    }

    [Fact]
    public async Task GetAll_is_shared_with_caregivers()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Read, owner.Id);
        h.Db.AddMedication(owner.Id, baby.Id);

        Assert.Single(await Services.Medications(h.Db).GetAllAsync(helper.Id));
    }

    [Fact]
    public async Task GetAll_hides_everything_from_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.AddMedication(owner.Id, baby.Id);

        Assert.Empty(await Services.Medications(h.Db).GetAllAsync(stranger.Id));
    }

    [Fact]
    public async Task Medications_stay_visible_on_the_free_plan()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser(plan: PlanTier.Free);
        var baby = h.Db.AddBaby(user.Id);
        h.Db.AddMedication(user.Id, baby.Id);

        // A schedule isn't history, so the Free tier's 7-day window must not hide it.
        Assert.Single(await Services.Medications(h.Db).GetAllAsync(user.Id, baby.Id));
    }

    [Fact]
    public async Task ToggleDone_marks_a_dose_given()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var medication = h.Db.AddMedication(user.Id, null);

        var (dto, notFound) = await Services.Medications(h.Db).ToggleDoneAsync(medication.GuidId, user.Id);

        Assert.Null(notFound);
        Assert.True(dto!.IsDoneToday);
    }

    [Fact]
    public async Task ToggleDone_flips_back_when_pressed_twice()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var medication = h.Db.AddMedication(user.Id, null);
        var service = Services.Medications(h.Db);

        await service.ToggleDoneAsync(medication.GuidId, user.Id);
        var (dto, _) = await service.ToggleDoneAsync(medication.GuidId, user.Id);

        Assert.False(dto!.IsDoneToday);
    }

    [Fact]
    public async Task A_dose_ticked_yesterday_reads_as_not_done_today()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var medication = h.Db.AddMedication(user.Id, null, isDoneToday: true, lastToggled: yesterday);

        var list = await Services.Medications(h.Db).GetAllAsync(user.Id);

        Assert.False(list[0].IsDoneToday);
    }

    [Fact]
    public async Task Toggling_a_stale_done_flag_marks_it_done_for_today()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var medication = h.Db.AddMedication(user.Id, null, isDoneToday: true, lastToggled: yesterday);

        var (dto, _) = await Services.Medications(h.Db).ToggleDoneAsync(medication.GuidId, user.Id);

        // Yesterday's tick doesn't count, so the first press today means "given".
        Assert.True(dto!.IsDoneToday);
    }

    [Fact]
    public async Task ToggleDone_is_allowed_for_a_log_caregiver_and_visible_to_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var helper = h.Db.AddUser("helper@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, helper.Id, CaregiverRole.Log, owner.Id);
        var medication = h.Db.AddMedication(owner.Id, baby.Id);

        var (dto, notFound) = await Services.Medications(h.Db).ToggleDoneAsync(medication.GuidId, helper.Id);

        Assert.Null(notFound);
        Assert.True(dto!.IsDoneToday);

        var ownerView = await Services.Medications(h.Db).GetAllAsync(owner.Id, baby.Id);
        Assert.True(ownerView[0].IsDoneToday);
    }

    [Fact]
    public async Task ToggleDone_is_refused_for_a_read_only_caregiver()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var medication = h.Db.AddMedication(owner.Id, baby.Id);

        var (dto, notFound) = await Services.Medications(h.Db).ToggleDoneAsync(medication.GuidId, reader.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task ToggleReminder_flips_the_flag()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var medication = h.Db.AddMedication(user.Id, null);

        var (dto, _) = await Services.Medications(h.Db).ToggleReminderAsync(medication.GuidId, user.Id);

        Assert.False(dto!.ReminderEnabled);
    }

    [Fact]
    public async Task ToggleReminder_is_refused_for_an_unrelated_user()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var stranger = h.Db.AddUser("stranger@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        var medication = h.Db.AddMedication(owner.Id, baby.Id);

        var (dto, notFound) = await Services.Medications(h.Db).ToggleReminderAsync(medication.GuidId, stranger.Id);

        Assert.Null(dto);
        Assert.Equal("not_found", notFound);
    }

    [Fact]
    public async Task Update_leaves_omitted_fields_untouched()
    {
        using var h = new TestDb();
        var user = h.Db.AddUser();
        var medication = h.Db.AddMedication(user.Id, null, "Vitamin D", "08:00");

        var (dto, _, error) = await Services.Medications(h.Db)
            .UpdateAsync(medication.GuidId, new UpdateMedicationDto(null, null, "09:30", null, null, null), user.Id);

        Assert.Null(error);
        Assert.Equal("09:30", dto!.TimeOfDay);
        Assert.Equal("Vitamin D", dto.Name);
    }

    [Fact]
    public async Task Delete_is_refused_for_a_read_only_caregiver_and_allowed_for_the_owner()
    {
        using var h = new TestDb();
        var owner = h.Db.AddUser();
        var reader = h.Db.AddUser("reader@example.com");
        var baby = h.Db.AddBaby(owner.Id);
        h.Db.GrantAccess(baby.Id, reader.Id, CaregiverRole.Read, owner.Id);
        var medication = h.Db.AddMedication(owner.Id, baby.Id);

        Assert.False(await Services.Medications(h.Db).DeleteAsync(medication.GuidId, reader.Id));
        Assert.True(await Services.Medications(h.Db).DeleteAsync(medication.GuidId, owner.Id));
    }
}
