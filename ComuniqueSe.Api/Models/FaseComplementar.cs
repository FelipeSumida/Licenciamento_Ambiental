using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class FaseComplementar
{
    [Key]
    public int Id { get; set; }

    public int TrechoId { get; set; }

    public string Fase { get; set; } = string.Empty;

    public string? DataEmissao { get; set; }

    public string? AnexoPdf { get; set; }

    [JsonIgnore]
    public Trecho? Trecho { get; set; }
}