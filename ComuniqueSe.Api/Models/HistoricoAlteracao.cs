using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class HistoricoAlteracao
{
    [Key]
    public int Id { get; set; }

    public int ProcessoId { get; set; }

    public DateTime DataHora { get; set; } = DateTime.Now;

    public string Descricao { get; set; } = string.Empty;

    [JsonIgnore]
    public Processo? Processo { get; set; }
}