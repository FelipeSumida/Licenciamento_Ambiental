using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComuniqueSe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposFase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Fase",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StatusFase",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataEmissaoFase",
                table: "Processos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataValidadeFase",
                table: "Processos",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Fase", table: "Processos");
            migrationBuilder.DropColumn(name: "StatusFase", table: "Processos");
            migrationBuilder.DropColumn(name: "DataEmissaoFase", table: "Processos");
            migrationBuilder.DropColumn(name: "DataValidadeFase", table: "Processos");
        }
    }
}
