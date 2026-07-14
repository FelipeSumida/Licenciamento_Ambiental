namespace ComuniqueSe.Api.Dtos;

public class PendenciaDto
{
    public int? Id { get; set; }

    public string Descricao { get; set; } = string.Empty;

    public string Situacao { get; set; } = string.Empty;

    public string DivisaoCap { get; set; } = string.Empty;

    public DateTime? DataEntrada { get; set; }

    public DateTime? Prazo { get; set; }

    public DateTime? DataSaida { get; set; }

    public List<string> AtribuidoA { get; set; } = [];

    public List<string> Regionais { get; set; } = [];

    public List<HistoricoDto> Historicos { get; set; } = [];
}