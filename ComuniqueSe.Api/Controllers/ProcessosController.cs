using ComuniqueSe.Api.Data;
using ComuniqueSe.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        _context.Trechos.RemoveRange(processoExistente.Trechos);
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
}