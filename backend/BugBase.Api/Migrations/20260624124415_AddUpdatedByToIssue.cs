using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BugBase.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUpdatedByToIssue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Issues",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Issues_UpdatedBy",
                table: "Issues",
                column: "UpdatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Issues_Users_UpdatedBy",
                table: "Issues",
                column: "UpdatedBy",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Issues_Users_UpdatedBy",
                table: "Issues");

            migrationBuilder.DropIndex(
                name: "IX_Issues_UpdatedBy",
                table: "Issues");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Issues");
        }
    }
}
