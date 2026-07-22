using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TinyTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBabiesAndMedications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_content_type",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "image_data",
                table: "milestones");

            migrationBuilder.AddColumn<int>(
                name: "baby_id",
                table: "sleep_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "baby_id",
                table: "pump_sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "baby_id",
                table: "milestones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_public_id",
                table: "milestones",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "milestones",
                type: "character varying(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "baby_id",
                table: "feeding_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "babies",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    avatar_color = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    weight_kg = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    height_cm = table.Column<decimal>(type: "numeric(5,1)", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_babies", x => x.id);
                    table.ForeignKey(
                        name: "fk_babies_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    baby_id = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    time_of_day = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    repeat_daily = table.Column<bool>(type: "boolean", nullable: false),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    is_done_today = table.Column<bool>(type: "boolean", nullable: false),
                    last_toggled_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medications", x => x.id);
                    table.ForeignKey(
                        name: "fk_medications_babies_baby_id",
                        column: x => x.baby_id,
                        principalTable: "babies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_medications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_sleep_logs_baby_id",
                table: "sleep_logs",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_pump_sessions_baby_id",
                table: "pump_sessions",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_milestones_baby_id",
                table: "milestones",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_feeding_logs_baby_id",
                table: "feeding_logs",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_babies_guid_id",
                table: "babies",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_babies_user_id",
                table: "babies",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_medications_baby_id",
                table: "medications",
                column: "baby_id");

            migrationBuilder.CreateIndex(
                name: "ix_medications_guid_id",
                table: "medications",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_medications_user_id",
                table: "medications",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_feeding_logs_baby_baby_id",
                table: "feeding_logs",
                column: "baby_id",
                principalTable: "babies",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_milestones_baby_baby_id",
                table: "milestones",
                column: "baby_id",
                principalTable: "babies",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_pump_sessions_baby_baby_id",
                table: "pump_sessions",
                column: "baby_id",
                principalTable: "babies",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_sleep_logs_baby_baby_id",
                table: "sleep_logs",
                column: "baby_id",
                principalTable: "babies",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_feeding_logs_baby_baby_id",
                table: "feeding_logs");

            migrationBuilder.DropForeignKey(
                name: "fk_milestones_baby_baby_id",
                table: "milestones");

            migrationBuilder.DropForeignKey(
                name: "fk_pump_sessions_baby_baby_id",
                table: "pump_sessions");

            migrationBuilder.DropForeignKey(
                name: "fk_sleep_logs_baby_baby_id",
                table: "sleep_logs");

            migrationBuilder.DropTable(
                name: "medications");

            migrationBuilder.DropTable(
                name: "babies");

            migrationBuilder.DropIndex(
                name: "ix_sleep_logs_baby_id",
                table: "sleep_logs");

            migrationBuilder.DropIndex(
                name: "ix_pump_sessions_baby_id",
                table: "pump_sessions");

            migrationBuilder.DropIndex(
                name: "ix_milestones_baby_id",
                table: "milestones");

            migrationBuilder.DropIndex(
                name: "ix_feeding_logs_baby_id",
                table: "feeding_logs");

            migrationBuilder.DropColumn(
                name: "baby_id",
                table: "sleep_logs");

            migrationBuilder.DropColumn(
                name: "baby_id",
                table: "pump_sessions");

            migrationBuilder.DropColumn(
                name: "baby_id",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "image_public_id",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "baby_id",
                table: "feeding_logs");

            migrationBuilder.AddColumn<string>(
                name: "image_content_type",
                table: "milestones",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte[]>(
                name: "image_data",
                table: "milestones",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
