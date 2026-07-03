using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;


namespace ComuniqueSe.Api.Models;

public class FaseComplementar
{
    [Key]
    public int Id { get; set; }
    public string Fase { get; set; } = string.Empty;

    public DateTime? DataEmissao { get; set; }

    public string? AnexoPdf { get; set; }
    public int ProcessoId { get; set; }
    [JsonIgnore]
    public Processo? Processo { get; set; }
}