using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComuniqueSe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteNumeroProcesso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProcessoNumero",
                table: "Processos",
                newName: "NumeroProcesso");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "NumeroProcesso",
                table: "Processos",
                newName: "ProcessoNumero");
        }
    }
}
