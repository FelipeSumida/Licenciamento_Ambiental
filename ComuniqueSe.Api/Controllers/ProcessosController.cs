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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Processo>>> GetProcessos()
    {
        return await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Processo>> GetProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .Include(p => p.HistoricosAlteracoes.OrderByDescending(h => h.DataHora))
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processo == null)
            return NotFound();

        return processo;
    }

    [HttpPost]
    public async Task<ActionResult<Processo>> PostProcesso(Processo processo)
    {
        _context.Processos.Add(processo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProcesso), new { id = processo.Id }, processo);
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
            .Include(p => p.Trechos)
                .ThenInclude(t => t.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processoExistente == null)
            return NotFound();

        var alteracoes = new List<string>();
        if (processoExistente.HistoricoProcessoData != processo.HistoricoProcessoData)
            alteracoes.Add($"Data do histórico do processo alterada de '{processoExistente.HistoricoProcessoData}' para '{processo.HistoricoProcessoData}'");

        if (processoExistente.HistoricoProcessoTexto != processo.HistoricoProcessoTexto)
            alteracoes.Add("Histórico do processo alterado");

        if (processoExistente.NumeroProcesso != processo.NumeroProcesso)
            alteracoes.Add($"Nº do processo alterado de '{processoExistente.NumeroProcesso}' para '{processo.NumeroProcesso}'");

        if (processoExistente.Interessado != processo.Interessado)
            alteracoes.Add($"Interessado alterado de '{processoExistente.Interessado}' para '{processo.Interessado}'");

        if (processoExistente.TecnicoResponsavel != processo.TecnicoResponsavel)
            alteracoes.Add($"Técnico responsável alterado de '{processoExistente.TecnicoResponsavel}' para '{processo.TecnicoResponsavel}'");

        if (processoExistente.IdentificacaoEmpreendimento != processo.IdentificacaoEmpreendimento)
            alteracoes.Add("Identificação do empreendimento alterada");

        if (processoExistente.CaracterizacaoEmpreendimento != processo.CaracterizacaoEmpreendimento)
            alteracoes.Add("Caracterização do empreendimento alterada");

        if (processoExistente.Empreendimento != processo.Empreendimento)
            alteracoes.Add($"Empreendimento alterado de '{processoExistente.Empreendimento}' para '{processo.Empreendimento}'");

        if (processoExistente.Classificacao != processo.Classificacao)
            alteracoes.Add($"Classificação alterada de '{processoExistente.Classificacao}' para '{processo.Classificacao}'");

        if (processoExistente.DivisaoCap != processo.DivisaoCap)
            alteracoes.Add($"Divisão CAP alterada de '{processoExistente.DivisaoCap}' para '{processo.DivisaoCap}'");

        if (processoExistente.Situacao != processo.Situacao)
            alteracoes.Add($"Situação alterada de '{processoExistente.Situacao}' para '{processo.Situacao}'");

        if (processoExistente.Fase != processo.Fase)
            alteracoes.Add($"Fase alterada de '{processoExistente.Fase}' para '{processo.Fase}'");

        if (processoExistente.StatusFase != processo.StatusFase)
            alteracoes.Add($"Status da fase alterado de '{processoExistente.StatusFase}' para '{processo.StatusFase}'");

        if (processoExistente.DataEntrada != processo.DataEntrada)
            alteracoes.Add($"Data de entrada alterada de '{processoExistente.DataEntrada}' para '{processo.DataEntrada}'");

        if (processoExistente.Prazo != processo.Prazo)
            alteracoes.Add($"Prazo alterado de '{processoExistente.Prazo}' para '{processo.Prazo}'");

        if (processoExistente.DataSaida != processo.DataSaida)
            alteracoes.Add($"Data de saída alterada de '{processoExistente.DataSaida}' para '{processo.DataSaida}'");

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
        }

        _context.Pendencias.RemoveRange(processoExistente.Pendencias);

        _context.Trechos.RemoveRange(processoExistente.Trechos);

        processoExistente.Trechos = processo.Trechos.Select(t => new Trecho
        {
            Denominacao = t.Denominacao,
            Rodovia = t.Rodovia,
            KmInicial = t.KmInicial,
            KmFinal = t.KmFinal,
            FaseComplementar = string.Join("; ",
                (t.FasesComplementares ?? new List<FaseComplementar>())
                    .Select(fc => fc.Fase)
            ),
            FasesComplementares = (t.FasesComplementares ?? new List<FaseComplementar>())
                .Select(fc => new FaseComplementar
                {
                    Fase = fc.Fase,
                    DataEmissao = fc.DataEmissao,
                    AnexoPdf = fc.AnexoPdf
                })
                .ToList(),
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

        processoExistente.Pendencias = processo.Pendencias;

        if (alteracoes.Any())
        {
            _context.HistoricosAlteracoes.Add(new HistoricoAlteracao
            {
                ProcessoId = processoExistente.Id,
                DataHora = DateTime.Now,
                Descricao = string.Join("\n", alteracoes)
            });
        }

        await _context.SaveChangesAsync();

        return Ok(processoExistente);
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
            p.Pendencias.Any() &&
            p.Pendencias.All(x => x.Situacao == "Atendida")
        );

        var porArea = processos
            .SelectMany(p => p.Pendencias)
            .GroupBy(p => p.DivisaoCap)
            .Select(g => new
            {
                area = g.Key,
                total = g.Count()
            })
            .ToList();

        var porTematica = processos
            .SelectMany(p => p.Pendencias)
            .GroupBy(p => p.Classificacao)
            .Select(g => new
            {
                classificacao = g.Key,
                total = g.Count()
            })
            .ToList();

        return Ok(new
        {
            abertos,
            concluidos,
            porArea,
            porTematica
        });
    }

}