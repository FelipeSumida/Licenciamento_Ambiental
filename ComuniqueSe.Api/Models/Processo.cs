using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComuniqueSe.Api.Models;

public class Processo
{
    [Key]
    public int Id { get; set; }

    [JsonPropertyName("processo")]
    public string NumeroProcesso { get; set; } = string.Empty;
    public string Empreendimento { get; set; } = string.Empty;
    public string Interessado { get; set; } = string.Empty;
    public string Classificacao { get; set; } = "LI";
    public string DivisaoCap { get; set; } = "Licenciamento";
    public DateTime? DataEntrada { get; set; }
    public DateTime? Prazo { get; set; }
    public DateTime? DataSaida { get; set; }
    public string TecnicoResponsavel { get; set; } = string.Empty;
    public string Situacao { get; set; } = "Aberta";
    public List<Trecho> Trechos { get; set; } = new();
    public List<Pendencia> Pendencias { get; set; } = new();
    public string Fase { get; set; } = string.Empty;
    public string StatusFase { get; set; } = string.Empty;
    public DateTime? DataEmissaoFase { get; set; }
    public DateTime? DataValidadeFase { get; set; }
    public string NumeroFase { get; set; } = string.Empty;
    public string? AnexoFase { get; set; }
    public string? AnexoFaseNome { get; set; }
    public string? AnexoFaseTipo { get; set; }
    public byte[]? AnexoFaseArquivo { get; set; }
    public string IdentificacaoEmpreendimento { get; set; } = string.Empty;
    public string CaracterizacaoEmpreendimento { get; set; } = string.Empty;
    public List<HistoricoAlteracao> HistoricosAlteracoes { get; set; } = new();
    public string? HistoricoProcessoData { get; set; }
    public string? HistoricoProcessoTexto { get; set; }
}

public class Trecho
{
    [Key]
    public int Id { get; set; }

    public string Denominacao { get; set; } = "";
    public string Rodovia { get; set; } = "";
    public string KmInicial { get; set; } = "";
    public string KmFinal { get; set; } = "";
    public int ProcessoId { get; set; }
    public List<FaseTrecho> Fases { get; set; } = new();
    [NotMapped]
    public string? FaseComplementar { get; set; }
    public List<FaseComplementar> FasesComplementares { get; set; } = new();
}

public class Pendencia
{
    [Key]
    public int Id { get; set; }

    public List<string> AtribuidoA { get; set; } = new();
    public List<string> Regionais { get; set; } = new();
    public string Descricao { get; set; } = "";
    public string Classificacao { get; set; } = "LI";
    public string DivisaoCap { get; set; } = "Licenciamento";
    public string Situacao { get; set; } = "Aberta";
    public DateTime? DataEntrada { get; set; }
    public DateTime? Prazo { get; set; }
    public DateTime? DataSaida { get; set; }

    public int ProcessoId { get; set; }
    public List<Historico> Historicos { get; set; } = new();
}

public class Historico
{
    [Key]
    public int Id { get; set; }

    public string Texto { get; set; } = "";
    public DateTime? Data { get; set; }

    public int PendenciaId { get; set; }
}