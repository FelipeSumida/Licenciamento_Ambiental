using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComuniqueSe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnexoPdf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnexoFase",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "AnexoFaseArquivo",
                table: "Processos",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnexoFaseNome",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnexoFaseTipo",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroFase",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnexoFase",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "AnexoFaseArquivo",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "AnexoFaseNome",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "AnexoFaseTipo",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "NumeroFase",
                table: "Processos");
        }
    }
}
