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
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Processo>> GetProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
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
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processoExistente == null)
            return NotFound();

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

        _context.Trechos.RemoveRange(processoExistente.Trechos);

        foreach (var pendencia in processoExistente.Pendencias)
        {
            _context.Historicos.RemoveRange(pendencia.Historicos);
        }

        _context.Pendencias.RemoveRange(processoExistente.Pendencias);

        processoExistente.Trechos = processo.Trechos;
        processoExistente.Pendencias = processo.Pendencias;

        await _context.SaveChangesAsync();

        return Ok(processoExistente);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
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