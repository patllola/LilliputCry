using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TinyTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesAndSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

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

            migrationBuilder.AddColumn<DateTime>(
                name: "trial_started_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "milestones",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    achieved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    image_data = table.Column<byte[]>(type: "bytea", nullable: false),
                    image_content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_milestones", x => x.id);
                    table.ForeignKey(
                        name: "fk_milestones_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pump_sessions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    pumped_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    left_amount = table.Column<decimal>(type: "numeric(6,1)", nullable: false),
                    right_amount = table.Column<decimal>(type: "numeric(6,1)", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pump_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_pump_sessions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sleep_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    guid_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    sleep_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sleep_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_nap = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sleep_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_sleep_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_milestones_achieved_at",
                table: "milestones",
                column: "achieved_at");

            migrationBuilder.CreateIndex(
                name: "ix_milestones_guid_id",
                table: "milestones",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_milestones_user_id",
                table: "milestones",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_pump_sessions_pumped_at",
                table: "pump_sessions",
                column: "pumped_at");

            migrationBuilder.CreateIndex(
                name: "ix_pump_sessions_guid_id",
                table: "pump_sessions",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pump_sessions_user_id",
                table: "pump_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_sleep_logs_sleep_start",
                table: "sleep_logs",
                column: "sleep_start");

            migrationBuilder.CreateIndex(
                name: "ix_sleep_logs_guid_id",
                table: "sleep_logs",
                column: "guid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sleep_logs_user_id",
                table: "sleep_logs",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "milestones");

            migrationBuilder.DropTable(
                name: "pump_sessions");

            migrationBuilder.DropTable(
                name: "sleep_logs");

            migrationBuilder.DropColumn(
                name: "role",
                table: "users");

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

            migrationBuilder.DropColumn(
                name: "trial_started_at",
                table: "users");
        }
    }
}
