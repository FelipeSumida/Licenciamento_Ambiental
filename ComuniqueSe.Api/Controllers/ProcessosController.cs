using ComuniqueSe.Api.Data;
using ComuniqueSe.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace ComuniqueSe.Api.Controllers;

[ApiController]
[Route("api/processos")]
public class ProcessosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProcessosController(AppDbContext context)
    {
        _context = context;
    }

    private void RegistrarAlteracao(
        int processoId,
        string campo,
        object? valorAnterior,
        object? valorNovo)
    {
        var anterior = valorAnterior?.ToString()?.Trim() ?? string.Empty;
        var novo = valorNovo?.ToString()?.Trim() ?? string.Empty;

        if (anterior == novo)
            return;

        string operacao;

        if (string.IsNullOrWhiteSpace(anterior) &&
            !string.IsNullOrWhiteSpace(novo))
        {
            operacao = "Criação";
        }
        else if (!string.IsNullOrWhiteSpace(anterior) &&
                string.IsNullOrWhiteSpace(novo))
        {
            operacao = "Exclusão";
        }
        else
        {
            operacao = "Alteração";
        }

        _context.HistoricosAlteracoes.Add(new HistoricoAlteracao
        {
            ProcessoId = processoId,
            DataHora = DateTime.Now,
            Usuario = "CAP",
            Operacao = operacao,
            Campo = campo,
            ValorAnterior = string.IsNullOrWhiteSpace(anterior)
                ? null
                : anterior,
            ValorNovo = string.IsNullOrWhiteSpace(novo)
                ? null
                : novo
        });
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Processo>>> GetProcessos()
    {
        return await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .OrderByDescending(p => p.Id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Processo>> GetProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .Include(p => p.Pendencias)
                .ThenInclude(pendencia => pendencia.PendenciasRegionais)
                    .ThenInclude(vinculo => vinculo.Regional)
            .Include(p => p.HistoricosAlteracoes.OrderByDescending(h => h.DataHora))
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processo == null)
            return NotFound();

        foreach (var pendencia in processo.Pendencias)
        {
            pendencia.Regionais = pendencia.PendenciasRegionais
                .Select(vinculo => vinculo.Regional.Codigo)
                .ToList();

            Console.WriteLine(
                $"GET - Pendência {pendencia.Id}: {string.Join(", ", pendencia.Regionais)}"
            );
        }

        return Ok(processo);
    }

    [HttpPost]
    public async Task<ActionResult<Processo>> PostProcesso(Processo processo)
    {
        var processoNovo = new Processo
        {
            NumeroProcesso = processo.NumeroProcesso,
            Empreendimento = processo.Empreendimento,
            Interessado = processo.Interessado,
            Classificacao = processo.Classificacao,
            DivisaoCap = processo.DivisaoCap,
            DataEntrada = processo.DataEntrada,
            Prazo = processo.Prazo,
            DataSaida = processo.DataSaida,
            TecnicoResponsavel = processo.TecnicoResponsavel,
            Situacao = processo.Situacao,
            Fase = processo.Fase,
            StatusFase = processo.StatusFase,
            DataEmissaoFase = processo.DataEmissaoFase,
            DataValidadeFase = processo.DataValidadeFase,
            NumeroFase = processo.NumeroFase,
            AnexoFase = processo.AnexoFase,
            IdentificacaoEmpreendimento = processo.IdentificacaoEmpreendimento,
            CaracterizacaoEmpreendimento = processo.CaracterizacaoEmpreendimento,
            HistoricoProcessoData = processo.HistoricoProcessoData,
            HistoricoProcessoTexto = processo.HistoricoProcessoTexto,

            Trechos = (processo.Trechos ?? new List<Trecho>())
                .Select(t => new Trecho
                {
                    Denominacao = t.Denominacao,
                    Rodovia = t.Rodovia,
                    KmInicial = t.KmInicial,
                    KmFinal = t.KmFinal,

                    Fases = (t.Fases ?? new List<FaseTrecho>())
                        .Select(f => new FaseTrecho
                        {
                            Fase = f.Fase,
                            StatusFase = f.StatusFase,
                            NumeroFase = f.NumeroFase,
                            DataEmissaoFase = f.DataEmissaoFase,
                            DataValidadeFase = f.DataValidadeFase,
                            AnexoFase = f.AnexoFase
                        })
                        .ToList()
                })
                .ToList(),

            FasesComplementares = (processo.FasesComplementares ?? new List<FaseComplementar>())
                .Select(fc => new FaseComplementar
                {
                    Fase = fc.Fase,
                    DataEmissao = fc.DataEmissao,
                    AnexoPdf = fc.AnexoPdf
                })
                .ToList(),

            Pendencias = new List<Pendencia>()
        };

        var vinculosRegionaisPendentes =
            new List<(Pendencia Pendencia, List<int> RegionalIds)>();

        foreach (var pendenciaRecebida in processo.Pendencias ?? new List<Pendencia>())
        {
            var novaPendencia = new Pendencia
            {
                Descricao = pendenciaRecebida.Descricao,
                Situacao = pendenciaRecebida.Situacao,
                DivisaoCap = pendenciaRecebida.DivisaoCap,
                DataEntrada = pendenciaRecebida.DataEntrada,
                Prazo = pendenciaRecebida.Prazo,
                DataSaida = pendenciaRecebida.DataSaida,
                AtribuidoA = pendenciaRecebida.AtribuidoA,

                Historicos = (pendenciaRecebida.Historicos ?? new List<Historico>())
                    .Select(h => new Historico
                    {
                        Data = h.Data,
                        Texto = h.Texto
                    })
                    .ToList()
            };

            var idsRegionais = new List<int>();

            if (pendenciaRecebida.Regionais != null &&
                pendenciaRecebida.Regionais.Count > 0)
            {
                idsRegionais = await _context.Regionais
                    .Where(r => pendenciaRecebida.Regionais.Contains(r.Codigo))
                    .Select(r => r.IdRegional)
                    .ToListAsync();
            }

            processoNovo.Pendencias.Add(novaPendencia);

            vinculosRegionaisPendentes.Add((
                novaPendencia,
                idsRegionais
            ));
        }

        _context.Processos.Add(processoNovo);

        await _context.SaveChangesAsync();

        foreach (var item in vinculosRegionaisPendentes)
        {
            foreach (var regionalId in item.RegionalIds)
            {
                _context.PendenciasRegionais.Add(new PendenciaRegional
                {
                    PendenciaId = item.Pendencia.Id,
                    RegionalId = regionalId
                });
            }
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProcesso),
            new { id = processoNovo.Id },
            processoNovo
        );
    }

    [HttpPost("{id}/anexo-fase")]
    public async Task<IActionResult> UploadAnexoFase(int id, IFormFile arquivo)
    {
        var processo = await _context.Processos.FindAsync(id);

        if (processo == null)
            return NotFound();

        if (arquivo == null || arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        if (arquivo.ContentType != "application/pdf")
            return BadRequest("Apenas arquivos PDF são permitidos.");

        using var memoryStream = new MemoryStream();
        await arquivo.CopyToAsync(memoryStream);

        processo.AnexoFaseNome = arquivo.FileName;
        processo.AnexoFaseTipo = arquivo.ContentType;
        processo.AnexoFaseArquivo = memoryStream.ToArray();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            processo.AnexoFaseNome,
            processo.AnexoFaseTipo
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutProcesso(int id, Processo processo)
    {
        Console.WriteLine();
        Console.WriteLine("==================================");
        Console.WriteLine("PUTPROCESSO FOI CHAMADO");
        Console.WriteLine($"ID: {id}");
        Console.WriteLine($"Situação recebida: '{processo.Situacao}'");
        Console.WriteLine("==================================");
        Console.WriteLine();

        var processoExistente = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.PendenciasRegionais)
                    .ThenInclude(pr => pr.Regional)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processoExistente == null)
            return NotFound();

        
        RegistrarAlteracao(
            processoExistente.Id,
            "Número do processo",
            processoExistente.NumeroProcesso,
            processo.NumeroProcesso
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Empreendimento",
            processoExistente.Empreendimento,
            processo.Empreendimento
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Classificação",
            processoExistente.Classificacao,
            processo.Classificacao
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Interessado",
            processoExistente.Interessado,
            processo.Interessado
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Técnico responsável",
            processoExistente.TecnicoResponsavel,
            processo.TecnicoResponsavel
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Divisão CAP",
            processoExistente.DivisaoCap,
            processo.DivisaoCap
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Situação",
            processoExistente.Situacao,
            processo.Situacao
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Identificação do empreendimento",
            processoExistente.IdentificacaoEmpreendimento,
            processo.IdentificacaoEmpreendimento
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Caracterização do empreendimento",
            processoExistente.CaracterizacaoEmpreendimento,
            processo.CaracterizacaoEmpreendimento
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Data de entrada",
            processoExistente.DataEntrada?.ToString("dd/MM/yyyy"),
            processo.DataEntrada?.ToString("dd/MM/yyyy")
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Prazo",
            processoExistente.Prazo?.ToString("dd/MM/yyyy"),
            processo.Prazo?.ToString("dd/MM/yyyy")
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Data de saída",
            processoExistente.DataSaida?.ToString("dd/MM/yyyy"),
            processo.DataSaida?.ToString("dd/MM/yyyy")
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Fase atual",
            processoExistente.Fase,
            processo.Fase
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Situação da fase",
            processoExistente.StatusFase,
            processo.StatusFase
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Número da fase",
            processoExistente.NumeroFase,
            processo.NumeroFase
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Data de emissão da fase",
            processoExistente.DataEmissaoFase?.ToString("dd/MM/yyyy"),
            processo.DataEmissaoFase?.ToString("dd/MM/yyyy")
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Data de validade da fase",
            processoExistente.DataValidadeFase?.ToString("dd/MM/yyyy"),
            processo.DataValidadeFase?.ToString("dd/MM/yyyy")
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Data do histórico do processo",
            processoExistente.HistoricoProcessoData,
            processo.HistoricoProcessoData
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Histórico do processo",
            processoExistente.HistoricoProcessoTexto,
            processo.HistoricoProcessoTexto
        );

        var trechosAnteriores = string.Join(
            " | ",
            processoExistente.Trechos.Select(t =>
                $"{t.Denominacao} - {t.Rodovia} - KM {t.KmInicial} ao KM {t.KmFinal}"
            )
        );

        var trechosNovos = string.Join(
            " | ",
            (processo.Trechos ?? new List<Trecho>()).Select(t =>
                $"{t.Denominacao} - {t.Rodovia} - KM {t.KmInicial} ao KM {t.KmFinal}"
            )
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Trechos",
            trechosAnteriores,
            trechosNovos
        );

        var historicosAnteriores = string.Join(
            " | ",
            processoExistente.Pendencias
                .SelectMany(p => p.Historicos ?? new List<Historico>())
                .Select(h =>
                    $"{h.Data?.ToString("dd/MM/yyyy")}: {h.Texto}"
                )
        );

        var historicosNovos = string.Join(
            " | ",
            (processo.Pendencias ?? new List<Pendencia>())
                .SelectMany(p => p.Historicos ?? new List<Historico>())
                .Select(h =>
                    $"{h.Data?.ToString("dd/MM/yyyy")}: {h.Texto}"
                )
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Históricos das pendências",
            historicosAnteriores,
            historicosNovos
        );

        
        var pendenciasAntigas =
            processoExistente.Pendencias ?? new List<Pendencia>();

        var pendenciasNovas =
            processo.Pendencias ?? new List<Pendencia>();

        var maiorQuantidade = Math.Max(
            pendenciasAntigas.Count,
            pendenciasNovas.Count
        );

        for (var i = 0; i < maiorQuantidade; i++)
        {
            var pendenciaAntiga =
                i < pendenciasAntigas.Count
                    ? pendenciasAntigas[i]
                    : null;

            var pendenciaNova =
                i < pendenciasNovas.Count
                    ? pendenciasNovas[i]
                    : null;

            var nomeBase = $"Pendência {i + 1}";

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Descrição",
                pendenciaAntiga?.Descricao,
                pendenciaNova?.Descricao
            );

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Situação",
                pendenciaAntiga?.Situacao,
                pendenciaNova?.Situacao
            );

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Divisão CAP",
                pendenciaAntiga?.DivisaoCap,
                pendenciaNova?.DivisaoCap
            );

            var atribuicoesAntigas =
                pendenciaAntiga?.AtribuidoA != null
                    ? string.Join(", ", pendenciaAntiga.AtribuidoA)
                    : string.Empty;

            var atribuicoesNovas =
                pendenciaNova?.AtribuidoA != null
                    ? string.Join(", ", pendenciaNova.AtribuidoA)
                    : string.Empty;

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Atribuído a",
                atribuicoesAntigas,
                atribuicoesNovas
            );

            var regionaisAntigas =
                pendenciaAntiga?.PendenciasRegionais != null
                    ? string.Join(
                        ", ",
                        pendenciaAntiga.PendenciasRegionais
                            .Where(pr => pr.Regional != null)
                            .Select(pr => pr.Regional.Codigo)
                            .OrderBy(codigo => codigo)
                    )
                    : string.Empty;

            var regionaisNovas =
                pendenciaNova?.Regionais != null
                    ? string.Join(
                        ", ",
                        pendenciaNova.Regionais.OrderBy(codigo => codigo)
                    )
                    : string.Empty;

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Regionais",
                regionaisAntigas,
                regionaisNovas
            );

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Data de entrada",
                pendenciaAntiga?.DataEntrada?.ToString("dd/MM/yyyy"),
                pendenciaNova?.DataEntrada?.ToString("dd/MM/yyyy")
            );

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Prazo",
                pendenciaAntiga?.Prazo?.ToString("dd/MM/yyyy"),
                pendenciaNova?.Prazo?.ToString("dd/MM/yyyy")
            );

            RegistrarAlteracao(
                processoExistente.Id,
                $"{nomeBase} - Data de saída",
                pendenciaAntiga?.DataSaida?.ToString("dd/MM/yyyy"),
                pendenciaNova?.DataSaida?.ToString("dd/MM/yyyy")
            );
        }

        var fasesTrechoAnteriores = string.Join(
            " | ",
            processoExistente.Trechos
                .SelectMany((trecho, trechoIndex) =>
                    (trecho.Fases ?? new List<FaseTrecho>())
                        .Select((fase, faseIndex) =>
                            $"Trecho {trechoIndex + 1} - Fase {faseIndex + 1}: " +
                            $"{fase.Fase}; " +
                            $"Situação: {fase.StatusFase}; " +
                            $"Número: {fase.NumeroFase}; " +
                            $"Emissão: {(fase.DataEmissaoFase == default
                                ? "Sem data"
                                : fase.DataEmissaoFase.ToString())}; " +
                            $"Validade: {(fase.DataValidadeFase == default
                                ? "Sem data"
                                : fase.DataValidadeFase.ToString())}"
                        )
                )
        );

        var fasesTrechoNovas = string.Join(
            " | ",
            (processo.Trechos ?? new List<Trecho>())
                .SelectMany((trecho, trechoIndex) =>
                    (trecho.Fases ?? new List<FaseTrecho>())
                        .Select((fase, faseIndex) =>
                            $"Trecho {trechoIndex + 1} - Fase {faseIndex + 1}: " +
                            $"{fase.Fase}; " +
                            $"Situação: {fase.StatusFase}; " +
                            $"Número: {fase.NumeroFase}; " +
                            $"Emissão: {(fase.DataEmissaoFase == default
                                ? "Sem data"
                                : fase.DataEmissaoFase.ToString())}; " +
                            $"Validade: {(fase.DataValidadeFase == default
                                ? "Sem data"
                                : fase.DataValidadeFase.ToString())}"
                        )
                )
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Fases dos trechos",
            fasesTrechoAnteriores,
            fasesTrechoNovas
        );

        var fasesComplementaresAnteriores = string.Join(
            " | ",
            processoExistente.FasesComplementares.Select(fc =>
                $"{fc.Fase} - " +
                $"{(fc.DataEmissao.HasValue ? fc.DataEmissao.Value.ToString("dd/MM/yyyy") : "Sem data")}"
            )
        );

        var fasesComplementaresNovas = string.Join(
            " | ",
            (processo.FasesComplementares ?? new List<FaseComplementar>())
                .Select(fc =>
                    $"{fc.Fase} - " +
                    $"{(fc.DataEmissao.HasValue ? fc.DataEmissao.Value.ToString("dd/MM/yyyy") : "Sem data")}"
                )
        );

        RegistrarAlteracao(
            processoExistente.Id,
            "Fases complementares",
            fasesComplementaresAnteriores,
            fasesComplementaresNovas
        );

        processoExistente.NumeroProcesso = processo.NumeroProcesso;
        processoExistente.Empreendimento = processo.Empreendimento;
        processoExistente.Interessado = processo.Interessado;
        processoExistente.Classificacao = processo.Classificacao;
        processoExistente.DivisaoCap = processo.DivisaoCap;
        processoExistente.DataEntrada = processo.DataEntrada;
        processoExistente.Prazo = processo.Prazo;
        processoExistente.DataSaida = processo.DataSaida;
        processoExistente.TecnicoResponsavel = processo.TecnicoResponsavel;
        var pendenciasRecebidas = processo.Pendencias ?? new List<Pendencia>();

        processoExistente.Situacao =
            pendenciasRecebidas.Any(p =>
                string.Equals(
                    p.Situacao,
                    "Aberta",
                    StringComparison.OrdinalIgnoreCase
                )
            )
                ? "Aberta"
                : "Atendida";
        processoExistente.Fase = processo.Fase;
        processoExistente.StatusFase = processo.StatusFase;
        processoExistente.DataEmissaoFase = processo.DataEmissaoFase;
        processoExistente.DataValidadeFase = processo.DataValidadeFase;
        processoExistente.NumeroFase = processo.NumeroFase;
        processoExistente.AnexoFase = processo.AnexoFase;
        processoExistente.IdentificacaoEmpreendimento = processo.IdentificacaoEmpreendimento;
        processoExistente.CaracterizacaoEmpreendimento = processo.CaracterizacaoEmpreendimento;
        processoExistente.HistoricoProcessoData = processo.HistoricoProcessoData;
        processoExistente.HistoricoProcessoTexto = processo.HistoricoProcessoTexto;

        foreach (var pendencia in (processoExistente.Pendencias ?? new List<Pendencia>()))
        {
            _context.Historicos.RemoveRange(
                pendencia.Historicos ?? new List<Historico>()
            );

            _context.PendenciasRegionais.RemoveRange(
                pendencia.PendenciasRegionais ?? new List<PendenciaRegional>()
            );
        }

        _context.Pendencias.RemoveRange(
            processoExistente.Pendencias ?? new List<Pendencia>()
        );

        _context.Trechos.RemoveRange(
            processoExistente.Trechos ?? new List<Trecho>()
        );

        _context.FasesComplementares.RemoveRange(
            processoExistente.FasesComplementares ?? new List<FaseComplementar>()
        );

        processoExistente.Trechos =
            (processo.Trechos ?? new List<Trecho>())
            .Select(t => new Trecho
            {
                Denominacao = t.Denominacao,
                Rodovia = t.Rodovia,
                KmInicial = t.KmInicial,
                KmFinal = t.KmFinal,

                Fases = (t.Fases ?? new List<FaseTrecho>())
                    .Select(f => new FaseTrecho
                    {
                        Fase = f.Fase,
                        StatusFase = f.StatusFase,
                        NumeroFase = f.NumeroFase,
                        DataEmissaoFase = f.DataEmissaoFase,
                        DataValidadeFase = f.DataValidadeFase,
                        AnexoFase = f.AnexoFase
                    })
                    .ToList()
            })
            .ToList();


        processoExistente.FasesComplementares = (processo.FasesComplementares ?? new List<FaseComplementar>())
            .Select(fc => new FaseComplementar
            {
                Fase = fc.Fase,
                DataEmissao = fc.DataEmissao,
                AnexoPdf = fc.AnexoPdf,
                ProcessoId = processoExistente.Id
            })
            .ToList();

        processoExistente.Pendencias = new List<Pendencia>();

        var vinculosRegionaisPendentes = new List<(Pendencia Pendencia, List<int> RegionalIds)>();

        foreach (var pendenciaDto in (processo.Pendencias ?? new List<Pendencia>()))
        {
            var novaPendencia = new Pendencia
            {
                Descricao = pendenciaDto.Descricao,
                Situacao = pendenciaDto.Situacao,
                DivisaoCap = pendenciaDto.DivisaoCap,
                DataEntrada = pendenciaDto.DataEntrada,
                Prazo = pendenciaDto.Prazo,
                DataSaida = pendenciaDto.DataSaida,
                AtribuidoA = pendenciaDto.AtribuidoA,

                Historicos = (pendenciaDto.Historicos ?? new List<Historico>())
                    .Select(h => new Historico
                    {
                        Data = h.Data,
                        Texto = h.Texto
                    })
                    .ToList()
            };

            Console.WriteLine(
                $"Pendência: {pendenciaDto.Descricao} | Regionais recebidas: " +
                string.Join(", ", pendenciaDto.Regionais ?? new List<string>())
            );

            var idsRegionais = new List<int>();

            if (pendenciaDto.Regionais != null && pendenciaDto.Regionais.Count > 0)
            {
                var regionaisEncontradas = await _context.Regionais
                    .Where(r => pendenciaDto.Regionais.Contains(r.Codigo))
                    .ToListAsync();

                idsRegionais = regionaisEncontradas
                    .Select(r => r.IdRegional)
                    .ToList();
            }

            Console.WriteLine(
                $"IDs encontrados: {string.Join(", ", idsRegionais)}"
            );

            processoExistente.Pendencias.Add(novaPendencia);

            vinculosRegionaisPendentes.Add((
                novaPendencia,
                idsRegionais
            ));
        }

        await _context.SaveChangesAsync();

        foreach (var item in vinculosRegionaisPendentes)
        {
            foreach (var regionalId in item.RegionalIds)
            {
                _context.PendenciasRegionais.Add(new PendenciaRegional
                {
                    PendenciaId = item.Pendencia.Id,
                    RegionalId = regionalId
                });
            }
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processo == null)
            return NotFound();

        _context.Processos.Remove(processo);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("/api/dashboard/resumo")]
    public async Task<IActionResult> GetResumoDashboard()
    {
        var processos = await _context.Processos
            .Include(p => p.Pendencias)
            .ToListAsync();

        var abertos = processos.Count(p =>
            p.Pendencias.Any(x => x.Situacao == "Aberta")
        );

        var concluidos = processos.Count(p =>
            !p.Pendencias.Any() ||
            p.Pendencias.All(x => x.Situacao == "Atendida")
        );

        var total = processos.Count;

        var porArea = processos
            .SelectMany(p => p.Pendencias)
            .GroupBy(p => p.DivisaoCap)
            .Select(g => new
            {
                area = g.Key,
                total = g.Count()
            })
            .ToList();

        return Ok(new
        {
            abertos,
            concluidos,
            total,
            porArea,
        });
    }

}
