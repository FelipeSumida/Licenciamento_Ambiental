using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class FaseComplementar
{
    [Key]
    public int Id { get; set; }

    public string Fase { get; set; } = string.Empty;

    public DateTime? DataEmissao { get; set; }

    // Nome do arquivo
    public string? AnexoPdf { get; set; }

    // application/pdf
    public string? AnexoPdfTipo { get; set; }

    // Conteúdo real do PDF
    [JsonIgnore]
    public byte[]? AnexoPdfArquivo { get; set; }

    public int TrechoId { get; set; }

    [JsonIgnore]
    public Trecho? Trecho { get; set; }
}