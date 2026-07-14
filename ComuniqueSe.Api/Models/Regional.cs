using System.Text.Json.Serialization;

namespace ComuniqueSe.Api.Models;

public class Regional
{
    public int IdRegional { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Codigo { get; set; } = string.Empty;

    [JsonIgnore]
    public ICollection<PendenciaRegional> PendenciasRegionais { get; set; }
        = new List<PendenciaRegional>();
}