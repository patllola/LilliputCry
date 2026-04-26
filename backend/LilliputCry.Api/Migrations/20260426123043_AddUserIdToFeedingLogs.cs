using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToFeedingLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "feeding_logs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_feeding_logs_user_id",
                table: "feeding_logs",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_feeding_logs_users_user_id",
                table: "feeding_logs",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_feeding_logs_users_user_id",
                table: "feeding_logs");

            migrationBuilder.DropIndex(
                name: "ix_feeding_logs_user_id",
                table: "feeding_logs");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "feeding_logs");
        }
    }
}
