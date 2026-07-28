using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TinyTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCaregiverSharingAndPlanTiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EF scaffolds "" as the default for a new non-null string column. That value
            // can't be read back into the BillingCycle enum, so every pre-existing user
            // would blow up on their next profile load — seed the real enum name instead.
            migrationBuilder.AddColumn<string>(
                name: "billing_cycle",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Monthly");

            migrationBuilder.AddColumn<DateTime>(
                name: "plan_selected_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            // Same as billing_cycle above: existing rows must land on a parseable enum name.
            migrationBuilder.AddColumn<string>(
                name: "plan_tier",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Free");

            migrationBuilder.CreateTable(
                name: "caregiver_access",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    baby_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    granted_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_caregiver_access", x => x.id);
                    table.ForeignKey(
                        name: "fk_caregiver_access_baby_baby_id",
                        column: x => x.baby_id,
                        principalTable: "babies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_caregiver_access_user_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "caregiver_invites",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    baby_id = table.Column<int>(type: "integer", nullable: false),
                    invited_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    accepted_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_caregiver_invites", x => x.id);
                    table.ForeignKey(
                        name: "fk_caregiver_invites_babies_baby_id",
                        column: x => x.baby_id,
                        principalTable: "babies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_caregiver_invites_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_access_baby_id_user_id",
                table: "caregiver_access",
                columns: new[] { "baby_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_access_guid_id",
                table: "caregiver_access",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_access_user_id",
                table: "caregiver_access",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_caregiver_invites_email",
                table: "caregiver_invites",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_invites_baby_id",
                table: "caregiver_invites",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_invites_guid_id",
                table: "caregiver_invites",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_invites_invited_by_user_id",
                table: "caregiver_invites",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_caregiver_invites_token",
                table: "caregiver_invites",
                column: "token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "caregiver_access");

            migrationBuilder.DropTable(
                name: "caregiver_invites");

            migrationBuilder.DropColumn(
                name: "billing_cycle",
                table: "users");

            migrationBuilder.DropColumn(
                name: "plan_selected_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "plan_tier",
                table: "users");
        }
    }
}
