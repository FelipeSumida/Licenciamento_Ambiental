using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComuniqueSe.Api.Migrations
{
    /// <inheritdoc />
    public partial class FaseDentroTrecho : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnexoFase",
                table: "Trechos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataEmissaoFase",
                table: "Trechos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataValidadeFase",
                table: "Trechos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Fase",
                table: "Trechos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NumeroFase",
                table: "Trechos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StatusFase",
                table: "Trechos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnexoFase",
                table: "Trechos");

            migrationBuilder.DropColumn(
                name: "DataEmissaoFase",
                table: "Trechos");

            migrationBuilder.DropColumn(
                name: "DataValidadeFase",
                table: "Trechos");

            migrationBuilder.DropColumn(
                name: "Fase",
                table: "Trechos");

            migrationBuilder.DropColumn(
                name: "NumeroFase",
                table: "Trechos");

            migrationBuilder.DropColumn(
                name: "StatusFase",
                table: "Trechos");
        }
    }
}
