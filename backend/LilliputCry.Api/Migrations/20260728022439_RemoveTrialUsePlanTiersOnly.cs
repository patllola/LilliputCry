using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTrialUsePlanTiersOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "subscription_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "subscription_started_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "subscription_status",
                table: "users");

            migrationBuilder.DropColumn(
                name: "trial_ends_at",
                table: "users");

            // EF scaffolded this pair as a rename of trial_started_at, which would carry
            // each user's old trial start date into plan_expires_at — a paid-access expiry
            // derived from something that never meant that. Drop and add instead, so every
            // user starts with no paid expiry at all.
            migrationBuilder.DropColumn(
                name: "trial_started_at",
                table: "users");

            migrationBuilder.AddColumn<DateTime>(
                name: "plan_expires_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            // Trial is gone: everyone lands on Free and upgrades from there.
            migrationBuilder.Sql(
                "UPDATE users SET plan_tier = 'Free', billing_cycle = 'Monthly', plan_selected_at = NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "plan_expires_at",
                table: "users");

            migrationBuilder.AddColumn<DateTime>(
                name: "trial_started_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "subscription_expires_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "subscription_started_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subscription_status",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "trial_ends_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
