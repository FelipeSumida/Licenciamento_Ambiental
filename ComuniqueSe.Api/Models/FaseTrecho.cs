using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class FaseTrecho
{
    [Key]
    public int Id { get; set; }

    public int TrechoId { get; set; }

    public string Fase { get; set; } = string.Empty;

    public string StatusFase { get; set; } = string.Empty;

    public string NumeroFase { get; set; } = string.Empty;

    public DateTime? DataEmissaoFase { get; set; }

    public DateTime? DataValidadeFase { get; set; }

    public string? AnexoFase { get; set; }

    [JsonIgnore]
    public Trecho? Trecho { get; set; }
}