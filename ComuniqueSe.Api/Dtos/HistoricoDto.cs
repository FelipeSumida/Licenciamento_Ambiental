namespace ComuniqueSe.Api.Dtos;

public class HistoricoDto
{
    public int? Id { get; set; }

    public DateTime? Data { get; set; }

    public string Texto { get; set; } = string.Empty;
}