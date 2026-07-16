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
        object? valorNovo,
        string operacao = "Alteração")
    {
        var anterior = valorAnterior?.ToString() ?? string.Empty;
        var novo = valorNovo?.ToString() ?? string.Empty;

        Console.WriteLine(
            $"HISTÓRICO: Campo={campo} | De={anterior} | Para={novo}"
        );

        if (operacao == "Alteração" && anterior == novo)
            return;

        _context.HistoricosAlteracoes.Add(new HistoricoAlteracao
        {
            ProcessoId = processoId,
            DataHora = DateTime.Now,
            Usuario = "CAP",
            Operacao = operacao,
            Campo = campo,
            ValorAnterior = string.IsNullOrWhiteSpace(anterior) ? null : anterior,
            ValorNovo = string.IsNullOrWhiteSpace(novo) ? null : novo,
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

        processoExistente.NumeroProcesso = processo.NumeroProcesso;
        processoExistente.Empreendimento = processo.Empreendimento;
        processoExistente.Interessado = processo.Interessado;
        processoExistente.Classificacao = processo.Classificacao;
        processoExistente.DivisaoCap = processo.DivisaoCap;
        processoExistente.DataEntrada = processo.DataEntrada;
        processoExistente.Prazo = processo.Prazo;
        processoExistente.DataSaida = processo.DataSaida;
        processoExistente.TecnicoResponsavel = processo.TecnicoResponsavel;
        processoExistente.Situacao = processo.Situacao;
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

        foreach (var pendencia in processoExistente.Pendencias)
        {
            _context.Historicos.RemoveRange(pendencia.Historicos);

            _context.PendenciasRegionais.RemoveRange(
                pendencia.PendenciasRegionais
            );
        }

        _context.Pendencias.RemoveRange(processoExistente.Pendencias);

        _context.Trechos.RemoveRange(processoExistente.Trechos);

        _context.FasesComplementares.RemoveRange(processoExistente.FasesComplementares);

        processoExistente.Trechos = processo.Trechos.Select(t => new Trecho
        {
            Denominacao = t.Denominacao,
            Rodovia = t.Rodovia,
            KmInicial = t.KmInicial,
            KmFinal = t.KmFinal,
            Fases = (t.Fases ?? new List<FaseTrecho>()).Select(f => new FaseTrecho
            {
                Fase = f.Fase,
                StatusFase = f.StatusFase,
                NumeroFase = f.NumeroFase,
                DataEmissaoFase = f.DataEmissaoFase,
                DataValidadeFase = f.DataValidadeFase,
                AnexoFase = f.AnexoFase
            }).ToList()
        }).ToList();


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

        foreach (var pendenciaDto in processo.Pendencias)
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
