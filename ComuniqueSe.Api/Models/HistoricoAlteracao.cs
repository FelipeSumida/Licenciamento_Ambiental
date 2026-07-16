using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class HistoricoAlteracao
{
    public int Id { get; set; }

    public int ProcessoId { get; set; }

    public DateTime DataHora { get; set; } = DateTime.Now;

    public string Usuario { get; set; } = "CAP";

    public string Operacao { get; set; } = string.Empty;

    public string Campo { get; set; } = string.Empty;

    public string? ValorAnterior { get; set; }

    public string? ValorNovo { get; set; }

    [JsonIgnore]
    public Processo? Processo { get; set; }
}