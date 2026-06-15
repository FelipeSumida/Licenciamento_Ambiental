using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComuniqueSe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposCompletos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CriadoEm",
                table: "Processos");

            migrationBuilder.RenameColumn(
                name: "NumeroProcesso",
                table: "Processos",
                newName: "ProcessoNumero");

            migrationBuilder.AddColumn<string>(
                name: "Classificacao",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataEntrada",
                table: "Processos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataSaida",
                table: "Processos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DivisaoCap",
                table: "Processos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "Prazo",
                table: "Processos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Pendencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtribuidoA = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Regionais = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Classificacao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DivisaoCap = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Situacao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataEntrada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Prazo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataSaida = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcessoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pendencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pendencias_Processos_ProcessoId",
                        column: x => x.ProcessoId,
                        principalTable: "Processos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Trechos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Denominacao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rodovia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KmInicial = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KmFinal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProcessoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trechos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trechos_Processos_ProcessoId",
                        column: x => x.ProcessoId,
                        principalTable: "Processos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Historicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PendenciaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Historicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Historicos_Pendencias_PendenciaId",
                        column: x => x.PendenciaId,
                        principalTable: "Pendencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Historicos_PendenciaId",
                table: "Historicos",
                column: "PendenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pendencias_ProcessoId",
                table: "Pendencias",
                column: "ProcessoId");

            migrationBuilder.CreateIndex(
                name: "IX_Trechos_ProcessoId",
                table: "Trechos",
                column: "ProcessoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Historicos");

            migrationBuilder.DropTable(
                name: "Trechos");

            migrationBuilder.DropTable(
                name: "Pendencias");

            migrationBuilder.DropColumn(
                name: "Classificacao",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "DataEntrada",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "DataSaida",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "DivisaoCap",
                table: "Processos");

            migrationBuilder.DropColumn(
                name: "Prazo",
                table: "Processos");

            migrationBuilder.RenameColumn(
                name: "ProcessoNumero",
                table: "Processos",
                newName: "NumeroProcesso");

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadoEm",
                table: "Processos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
