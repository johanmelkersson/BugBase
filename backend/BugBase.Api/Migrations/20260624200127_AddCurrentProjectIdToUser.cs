using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BugBase.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentProjectIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentProjectId",
                table: "Users",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentProjectId",
                table: "Users");
        }
    }
}
