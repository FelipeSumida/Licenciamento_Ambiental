using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class PendenciaRegional
{
    public int Id { get; set; }

    public int PendenciaId { get; set; }

    [JsonIgnore]
    public Pendencia Pendencia { get; set; } = null!;

    public int RegionalId { get; set; }

    public Regional Regional { get; set; } = null!;
}