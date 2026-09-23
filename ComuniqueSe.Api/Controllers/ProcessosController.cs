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

    private async Task<string> GerarProximoIdEmpreendimento()
    {
        var codigos = await _context.Processos
            .Where(p =>
                p.IdEmpreendimento != null &&
                p.IdEmpreendimento.StartsWith("EMP-"))
            .Select(p => p.IdEmpreendimento!)
            .ToListAsync();

        var maiorNumero = 0;

        foreach (var codigo in codigos)
        {
            if (codigo.Length > 4 &&
                int.TryParse(codigo.Substring(4), out var numero) &&
                numero > maiorNumero)
            {
                maiorNumero = numero;
            }
        }

        return $"EMP-{maiorNumero + 1:0000}";
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

    private void RegistrarAlteracaoTecnicos(
        int processoId,
        string? valorAnterior,
        string? valorNovo)
    {
        var anteriores =
            (valorAnterior ?? string.Empty)
                .Split(
                    ';',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries
                )
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();


        var novos =
            (valorNovo ?? string.Empty)
                .Split(
                    ';',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries
                )
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();


        var adicionados =
            novos
                .Where(n =>
                    !anteriores.Contains(
                        n,
                        StringComparer.OrdinalIgnoreCase
                    )
                )
                .ToList();


        var removidos =
            anteriores
                .Where(a =>
                    !novos.Contains(
                        a,
                        StringComparer.OrdinalIgnoreCase
                    )
                )
                .ToList();


        /*
        * Apenas adicionou técnico(s)
        */
        if (
            adicionados.Count > 0 &&
            removidos.Count == 0
        )
        {
            foreach (var tecnico in adicionados)
            {
                RegistrarAlteracao(
                    processoId,
                    "Técnico responsável",
                    null,
                    tecnico
                );
            }

            return;
        }


        /*
        * Apenas removeu técnico(s)
        */
        if (
            removidos.Count > 0 &&
            adicionados.Count == 0
        )
        {
            foreach (var tecnico in removidos)
            {
                RegistrarAlteracao(
                    processoId,
                    "Técnico responsável",
                    tecnico,
                    null
                );
            }

            return;
        }


        /*
        * Houve troca/edição
        */
        if (
            adicionados.Count > 0 ||
            removidos.Count > 0
        )
        {
            RegistrarAlteracao(
                processoId,
                "Técnico responsável",
                valorAnterior,
                valorNovo
            );
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Processo>>> GetProcessos()
    {
        return await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases.OrderBy(f => f.Ordem))
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Rodovia)
            .Include(p => p.Trechos)
                .ThenInclude(t => t.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .OrderByDescending(p => p.Id)
            .ToListAsync();
    }

    [HttpGet("rodovias")]
    public async Task<ActionResult> GetRodovias([FromQuery] string? busca)
    {
        var consulta = _context.SirgeoRodovias.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            consulta = consulta.Where(r =>
                r.RodCodigo.Contains(busca)
            );
        }

        var rodovias = await consulta
            .OrderBy(r => r.RodCodigo)
            .Take(100)
            .Select(r => new
            {
                rodId = r.RodId,
                rodCodigo = r.RodCodigo,
                kmInicial = r.RodKmInicial,
                kmFinal = r.RodKmFinal,
                extensao = r.RodKmExtensao
            })
            .ToListAsync();

        return Ok(rodovias);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Processo>> GetProcesso(int id)
    {
        var processo = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases.OrderBy(f => f.Ordem))
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Rodovia)
            .Include(p => p.Trechos)
                .ThenInclude(t => t.FasesComplementares)
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
        }

        return Ok(processo);
    }

    [HttpGet("rodovias/{rodId}/denominacoes")]
    public async Task<IActionResult> GetDenominacoesTrecho(
        long rodId,
        double kmInicial,
        double kmFinal)
    {
        var trechos = await (
            from t in _context.SirgeoTrechos

            join m in _context.Municipios
                on t.mun_ibge_id equals m.mun_ibge_id

            join r in _context.Regionais
                on m.id_regional equals r.IdRegional

            where
                t.rod_id == rodId &&
                t.rtr_km_final >= kmInicial &&
                t.rtr_km_inicial <= kmFinal

            orderby t.rtr_km_inicial

            select new
            {
                t.rtr_id,
                t.rod_id,

                kmInicial = t.rtr_km_inicial,
                kmFinal = t.rtr_km_final,

                denominacao = t.rtr_denominacao,

                municipio = m.nome,

                regional = r.Nome,
                codigoRegional = r.Codigo
            }
        ).ToListAsync();

        return Ok(trechos);
    }

    [HttpPost]
    public async Task<ActionResult<Processo>> PostProcesso(Processo processo)
    {
        var pendenciasRecebidas = processo.Pendencias ?? new List<Pendencia>();

        var situacaoCalculada =
            pendenciasRecebidas.Count == 0
                ? "Atendida"
                : pendenciasRecebidas.Any(p =>
                    string.Equals(
                        p.Situacao,
                        "Aberta",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                    ? "Aberta"
                    : "Atendida";

        var novoIdEmpreendimento = await GerarProximoIdEmpreendimento();
        var processoNovo = new Processo
        {
            IdEmpreendimento = novoIdEmpreendimento,
            Empreendimento = processo.Empreendimento,
            Interessado = processo.Interessado,
            Classificacao = processo.Classificacao,
            DivisaoCap = string.IsNullOrWhiteSpace(processo.DivisaoCap)
                ? null
                : processo.DivisaoCap.Trim(),
            DataEntrada = processo.DataEntrada,
            Prazo = processo.Prazo,
            DataSaida = processo.DataSaida,
            TecnicoResponsavel = processo.TecnicoResponsavel,
            Situacao = situacaoCalculada,
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
                    RodId = t.RodId,
                    KmInicial = t.KmInicial,
                    KmFinal = t.KmFinal,

                    Fases = (t.Fases ?? new List<FaseTrecho>())
                        .Select((f, faseIndex) => new FaseTrecho
                        {
                            Ordem = faseIndex + 1,
                            Fase = f.Fase,
                            NumeroProcesso = f.NumeroProcesso,
                            StatusFase = f.StatusFase,
                            NumeroFase = f.NumeroFase,
                            DataEmissaoFase = f.DataEmissaoFase,
                            DataValidadeFase = f.DataValidadeFase,
                            AnexoFase = f.AnexoFase
                        })
                        .ToList(),

                    FasesComplementares =
                        (t.FasesComplementares ?? new List<FaseComplementar>())
                        .Select(fc => new FaseComplementar
                        {
                            Fase = fc.Fase,
                            DataEmissao = fc.DataEmissao,
                            AnexoPdf = fc.AnexoPdf
                        })
                        .ToList()
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

            if (!string.IsNullOrWhiteSpace(pendenciaRecebida.FaseVinculadaRef))
            {
                var partes = pendenciaRecebida.FaseVinculadaRef.Split(':');

                if (
                    partes.Length == 2 &&
                    int.TryParse(partes[0], out var trechoIndex) &&
                    int.TryParse(partes[1], out var faseIndex) &&
                    trechoIndex >= 0 &&
                    trechoIndex < processoNovo.Trechos.Count &&
                    faseIndex >= 0 &&
                    faseIndex < processoNovo.Trechos[trechoIndex].Fases.Count
                )
                {
                    var faseSelecionada =
                        processoNovo.Trechos[trechoIndex].Fases[faseIndex];
                    novaPendencia.FaseTrecho = faseSelecionada;
                }
            }

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

    [HttpPost("fases-complementares/{faseComplementarId}/anexo")]
    public async Task<IActionResult> UploadAnexoFaseComplementar(
        int faseComplementarId,
        IFormFile arquivo
    )
    {
        var faseComplementar =
            await _context.FasesComplementares
                .FindAsync(faseComplementarId);

        if (faseComplementar == null)
        {
            return NotFound(
                "Fase complementar não encontrada."
            );
        }

        if (arquivo == null || arquivo.Length == 0)
        {
            return BadRequest(
                "Nenhum arquivo enviado."
            );
        }

        const long tamanhoMaximo = 20 * 1024 * 1024;

        if (arquivo.Length > tamanhoMaximo)
        {
            return BadRequest(
                "O arquivo deve possuir no máximo 20 MB."
            );
        }

        var extensao =
            Path.GetExtension(arquivo.FileName);

        if (
            !string.Equals(
                extensao,
                ".pdf",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return BadRequest(
                "Apenas arquivos PDF são permitidos."
            );
        }

        if (
            !string.Equals(
                arquivo.ContentType,
                "application/pdf",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return BadRequest(
                "O arquivo enviado não é um PDF válido."
            );
        }

        using var memoryStream =
            new MemoryStream();

        await arquivo.CopyToAsync(
            memoryStream
        );

        faseComplementar.AnexoPdf =
            Path.GetFileName(
                arquivo.FileName
            );

        faseComplementar.AnexoPdfTipo =
            arquivo.ContentType;

        faseComplementar.AnexoPdfArquivo =
            memoryStream.ToArray();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = faseComplementar.Id,
            anexoPdf =
                faseComplementar.AnexoPdf
        });
    }

    [HttpGet("fases-complementares/{faseComplementarId}/anexo")]
    public async Task<IActionResult> GetAnexoFaseComplementar(
        int faseComplementarId
    )
    {
        var faseComplementar =
            await _context.FasesComplementares
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    fc =>
                        fc.Id ==
                        faseComplementarId
                );

        if (faseComplementar == null)
        {
            return NotFound(
                "Fase complementar não encontrada."
            );
        }

        if (
            faseComplementar.AnexoPdfArquivo == null ||
            faseComplementar.AnexoPdfArquivo.Length == 0
        )
        {
            return NotFound(
                "Esta fase complementar não possui anexo."
            );
        }

        var tipoArquivo =
            string.IsNullOrWhiteSpace(faseComplementar.AnexoPdfTipo)
                ? "application/pdf"
                : faseComplementar.AnexoPdfTipo;

        var nomeArquivo =
            string.IsNullOrWhiteSpace(faseComplementar.AnexoPdf)
                ? "anexo.pdf"
                : faseComplementar.AnexoPdf;

        var nomeArquivoCodificado =
            Uri.EscapeDataString(nomeArquivo);

        Response.Headers.ContentDisposition =
            $"inline; filename=\"anexo.pdf\"; filename*=UTF-8''{nomeArquivoCodificado}";

        return File(
            faseComplementar.AnexoPdfArquivo,
            tipoArquivo
        );
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutProcesso(int id, Processo processo)
    {

        var processoExistente = await _context.Processos
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)
            .Include(p => p.Trechos)
                .ThenInclude(t => t.Rodovia)
            .Include(p => p.Trechos)
                .ThenInclude(t => t.FasesComplementares)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)
            .Include(p => p.Pendencias)
                .ThenInclude(p => p.PendenciasRegionais)
                    .ThenInclude(pr => pr.Regional)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processoExistente == null)
            return NotFound();

        var pendenciasRecebidas =
            processo.Pendencias ??
            new List<Pendencia>();


        var novaSituacao =
            pendenciasRecebidas.Any(p =>
                string.Equals(
                    p.Situacao,
                    "Aberta",
                    StringComparison.OrdinalIgnoreCase
                )
            )
                ? "Aberta"
                : "Atendida";

        
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

        RegistrarAlteracaoTecnicos(
            processoExistente.Id,
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
            novaSituacao
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
                $"{t.Rodovia?.RodCodigo ?? "Rodovia não informada"} - " +
                $"KM {t.KmInicial} ao KM {t.KmFinal}"
            )
        );

        var rodIdsNovos = (processo.Trechos ?? new List<Trecho>())
            .Where(t => t.RodId.HasValue)
            .Select(t => t.RodId!.Value)
            .Distinct()
            .ToList();

        var rodoviasNovas = await _context.SirgeoRodovias
            .Where(r => rodIdsNovos.Contains(r.RodId))
            .ToDictionaryAsync(
                r => r.RodId,
                r => r.RodCodigo
            );

        var trechosNovos = string.Join(
            " | ",
            (processo.Trechos ?? new List<Trecho>()).Select(t =>
            {
                var codigoRodovia =
                    t.RodId.HasValue &&
                    rodoviasNovas.TryGetValue(t.RodId.Value, out var codigo)
                        ? codigo
                        : "Rodovia não informada";

                return $"{codigoRodovia} - KM {t.KmInicial} ao KM {t.KmFinal}";
            })
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

        var trechosHistoricoAntigos =
            processoExistente.Trechos.ToList();

        var trechosHistoricoNovos =
            processo.Trechos ?? new List<Trecho>();


        for (
            var trechoIndex = 0;
            trechoIndex < trechosHistoricoNovos.Count;
            trechoIndex++
        )
        {
            var trechoNovo =
                trechosHistoricoNovos[trechoIndex];


            var trechoAntigo =
                trechoNovo.Id > 0
                    ? trechosHistoricoAntigos
                        .FirstOrDefault(t =>
                            t.Id == trechoNovo.Id
                        )
                    : null;


            var fasesAntigas =
                trechoAntigo?.Fases
                ?? new List<FaseTrecho>();

            var fasesNovas =
                trechoNovo.Fases
                ?? new List<FaseTrecho>();


            for (
                var faseIndex = 0;
                faseIndex < fasesNovas.Count;
                faseIndex++
            )
            {
                var faseNova =
                    fasesNovas[faseIndex];


                var faseAntiga =
                    faseNova.Id > 0
                        ? fasesAntigas
                            .FirstOrDefault(f =>
                                f.Id == faseNova.Id
                            )
                        : null;


                var identificacao =
                    $"Trecho {trechoIndex + 1} / Fase {faseIndex + 1}";


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"Número do processo - {identificacao}",
                    faseAntiga?.NumeroProcesso,
                    faseNova.NumeroProcesso
                );


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"Fase - {identificacao}",
                    faseAntiga?.Fase,
                    faseNova.Fase
                );


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"Situação da fase - {identificacao}",
                    faseAntiga?.StatusFase,
                    faseNova.StatusFase
                );


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"N° da fase - {identificacao}",
                    faseAntiga?.NumeroFase,
                    faseNova.NumeroFase
                );


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"Data de emissão - {identificacao}",
                    faseAntiga?.DataEmissaoFase,
                    faseNova.DataEmissaoFase
                );


                RegistrarAlteracao(
                    processoExistente.Id,
                    $"Data de validade - {identificacao}",
                    faseAntiga?.DataValidadeFase,
                    faseNova.DataValidadeFase
                );
            }
        }



        var fasesComplementaresAnteriores = string.Join(
            " | ",
            processoExistente.Trechos
                .SelectMany(t =>
                    t.FasesComplementares ??
                    new List<FaseComplementar>()
                )
                .Select(fc =>
                    $"{fc.Fase} - " +
                    $"{(
                        fc.DataEmissao.HasValue
                            ? fc.DataEmissao.Value.ToString("dd/MM/yyyy")
                            : "Sem data"
                    )}"
                )
        );


        var fasesComplementaresNovas = string.Join(
            " | ",
            (processo.Trechos ?? new List<Trecho>())
                .SelectMany(t =>
                    t.FasesComplementares ??
                    new List<FaseComplementar>()
                )
                .Select(fc =>
                    $"{fc.Fase} - " +
                    $"{(
                        fc.DataEmissao.HasValue
                            ? fc.DataEmissao.Value.ToString("dd/MM/yyyy")
                            : "Sem data"
                    )}"
                )
        );


        RegistrarAlteracao(
            processoExistente.Id,
            "Fases complementares",
            fasesComplementaresAnteriores,
            fasesComplementaresNovas
        );

        processoExistente.Empreendimento = processo.Empreendimento;
        processoExistente.Interessado = processo.Interessado;
        processoExistente.Classificacao = processo.Classificacao;
        processoExistente.DivisaoCap =
            string.IsNullOrWhiteSpace(processo.DivisaoCap)
                ? null
                : processo.DivisaoCap.Trim();
        processoExistente.DataEntrada = processo.DataEntrada;
        processoExistente.Prazo = processo.Prazo;
        processoExistente.DataSaida = processo.DataSaida;
        processoExistente.TecnicoResponsavel = processo.TecnicoResponsavel;
        processoExistente.Situacao = novaSituacao;
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

        var idsPendenciasRecebidas =
            pendenciasRecebidas
                .Where(p => p.Id > 0)
                .Select(p => p.Id)
                .ToHashSet();

        var pendenciasParaRemover =
            (processoExistente.Pendencias ?? new List<Pendencia>())
                .Where(
                    p =>
                        p.Id > 0 &&
                        !idsPendenciasRecebidas.Contains(p.Id)
                )
                .ToList();

        foreach (var pendencia in pendenciasParaRemover)
        {
            _context.Historicos.RemoveRange(
                pendencia.Historicos ?? new List<Historico>()
            );

            _context.PendenciasRegionais.RemoveRange(
                pendencia.PendenciasRegionais
                    ?? new List<PendenciaRegional>()
            );
        }

        _context.Pendencias.RemoveRange(
            pendenciasParaRemover
        );

        var trechosRecebidos = processo.Trechos ?? new List<Trecho>();

        var mapaTrechosSalvos =
            new List<(
                int Indice,
                Trecho Trecho,
                List<(
                    int Indice,
                    FaseComplementar Fase
                )> Complementares
            )>();

        // Remove somente trechos que realmente foram excluídos pelo usuário
        var idsTrechosRecebidos = trechosRecebidos
            .Where(t => t.Id > 0)
            .Select(t => t.Id)
            .ToHashSet();

        var trechosParaRemover = processoExistente.Trechos
            .Where(t => !idsTrechosRecebidos.Contains(t.Id))
            .ToList();

        _context.Trechos.RemoveRange(trechosParaRemover);


        for (
            int trechoIndex = 0;
            trechoIndex < trechosRecebidos.Count;
            trechoIndex++
        )
        {
            var trechoDto =
                trechosRecebidos[trechoIndex];

            var mapaComplementares =
                new List<(
                    int Indice,
                    FaseComplementar Fase
                )>();

            Trecho trechoExistente;

            if (trechoDto.Id > 0)
            {
                trechoExistente = processoExistente.Trechos
                    .FirstOrDefault(t => t.Id == trechoDto.Id)!;

                if (trechoExistente == null)
                    continue;

                trechoExistente.RodId = trechoDto.RodId;
                trechoExistente.KmInicial = trechoDto.KmInicial;
                trechoExistente.KmFinal = trechoDto.KmFinal;
            }
            else
            {
                trechoExistente = new Trecho
                {
                    RodId = trechoDto.RodId,
                    KmInicial = trechoDto.KmInicial,
                    KmFinal = trechoDto.KmFinal,
                    ProcessoId = processoExistente.Id,

                    Fases = new List<FaseTrecho>(),

                    FasesComplementares =
                        new List<FaseComplementar>()
                };

                processoExistente.Trechos.Add(trechoExistente);
            }


            var fasesRecebidas = trechoDto.Fases ?? new List<FaseTrecho>();

            // Remove somente fases realmente excluídas
            var idsFasesRecebidas = fasesRecebidas
                .Where(f => f.Id > 0)
                .Select(f => f.Id)
                .ToHashSet();

            var fasesParaRemover = trechoExistente.Fases
                .Where(f => !idsFasesRecebidas.Contains(f.Id))
                .ToList();

            _context.FasesTrecho.RemoveRange(fasesParaRemover);


            // Atualiza fases existentes e cria somente as novas
            for (int faseIndex = 0; faseIndex < fasesRecebidas.Count; faseIndex++)
            {
                var faseDto = fasesRecebidas[faseIndex];
                
                if (faseDto.Id > 0)
                {
                    var faseExistente = trechoExistente.Fases
                        .FirstOrDefault(f => f.Id == faseDto.Id);

                    if (faseExistente == null)
                        continue;

                    faseExistente.Ordem = faseIndex + 1;
                    faseExistente.Fase = faseDto.Fase;
                    faseExistente.StatusFase = faseDto.StatusFase;
                    faseExistente.NumeroProcesso = faseDto.NumeroProcesso;
                    faseExistente.NumeroFase = faseDto.NumeroFase;
                    faseExistente.DataEmissaoFase = faseDto.DataEmissaoFase;
                    faseExistente.DataValidadeFase = faseDto.DataValidadeFase;
                    faseExistente.AnexoFase = faseDto.AnexoFase;
                }
                else
                {
                    trechoExistente.Fases.Add(new FaseTrecho
                    {
                        Ordem = faseIndex + 1,
                        Fase = faseDto.Fase,
                        StatusFase = faseDto.StatusFase,
                        NumeroProcesso = faseDto.NumeroProcesso,
                        NumeroFase = faseDto.NumeroFase,
                        DataEmissaoFase = faseDto.DataEmissaoFase,
                        DataValidadeFase = faseDto.DataValidadeFase,
                        AnexoFase = faseDto.AnexoFase
                    });
                }
            }

            // ============================================
            // FASES COMPLEMENTARES DO TRECHO
            // ============================================

            var complementaresRecebidas =
                trechoDto.FasesComplementares ??
                new List<FaseComplementar>();


            // IDs que continuam existindo na tela
            var idsComplementaresRecebidas =
                complementaresRecebidas
                    .Where(fc => fc.Id > 0)
                    .Select(fc => fc.Id)
                    .ToHashSet();


            // Remove somente as complementares
            // que o usuário realmente excluiu
            var complementaresParaRemover =
                trechoExistente.FasesComplementares
                    .Where(fc =>
                        !idsComplementaresRecebidas.Contains(fc.Id)
                    )
                    .ToList();


            _context.FasesComplementares.RemoveRange(
                complementaresParaRemover
            );


            // Atualiza existentes e cria novas
            for (
                int complementarIndex = 0;
                complementarIndex < complementaresRecebidas.Count;
                complementarIndex++
            )
            {
                var complementarDto =
                    complementaresRecebidas[
                        complementarIndex
                    ];

                FaseComplementar complementarSalva;


                if (complementarDto.Id > 0)
                {
                    var complementarExistente =
                        trechoExistente
                            .FasesComplementares
                            .FirstOrDefault(fc =>
                                fc.Id ==
                                complementarDto.Id
                            );

                    if (complementarExistente == null)
                    {
                        continue;
                    }


                    complementarExistente.Fase =
                        complementarDto.Fase;

                    complementarExistente.DataEmissao =
                        complementarDto.DataEmissao;


                    /*
                    * NÃO alteramos:
                    *
                    * AnexoPdf
                    * AnexoPdfTipo
                    * AnexoPdfArquivo
                    *
                    * O anexo é atualizado somente
                    * pelo endpoint específico de upload.
                    */

                    complementarSalva =
                        complementarExistente;
                }
                else
                {
                    var novaComplementar =
                        new FaseComplementar
                        {
                            Fase =
                                complementarDto.Fase,

                            DataEmissao =
                                complementarDto.DataEmissao
                        };

                    trechoExistente
                        .FasesComplementares
                        .Add(novaComplementar);

                    complementarSalva =
                        novaComplementar;
                }


                mapaComplementares.Add(
                    (
                        complementarIndex,
                        complementarSalva
                    )
                );
            }

            mapaTrechosSalvos.Add(
                (
                    trechoIndex,
                    trechoExistente,
                    mapaComplementares
                )
            );
        }

        processoExistente.Pendencias ??= new List<Pendencia>();

        var vinculosRegionaisPendentes =
            new List<(Pendencia Pendencia, List<int> RegionalIds)>();

        foreach (var pendenciaDto in pendenciasRecebidas)
        {
            Pendencia? pendenciaDestino;

            // Pendência que já existe: mantém o mesmo ID
            if (pendenciaDto.Id > 0)
            {
                pendenciaDestino =
                    processoExistente.Pendencias
                        .FirstOrDefault(
                            p => p.Id == pendenciaDto.Id
                        );

                if (pendenciaDestino == null)
                {
                    return BadRequest(
                        $"A pendência {pendenciaDto.Id} não pertence a este processo."
                    );
                }

                // Os históricos serão atualizados conforme o que veio da tela
                _context.Historicos.RemoveRange(
                    pendenciaDestino.Historicos
                        ?? new List<Historico>()
                );

                // Os vínculos regionais também serão refeitos
                _context.PendenciasRegionais.RemoveRange(
                    pendenciaDestino.PendenciasRegionais
                        ?? new List<PendenciaRegional>()
                );
            }
            else
            {
                // Somente pendência realmente nova recebe novo ID
                pendenciaDestino = new Pendencia();

                processoExistente.Pendencias.Add(
                    pendenciaDestino
                );
            }

            pendenciaDestino.Descricao =
                pendenciaDto.Descricao;

            pendenciaDestino.Situacao =
                pendenciaDto.Situacao;

            pendenciaDestino.DivisaoCap =
                pendenciaDto.DivisaoCap;

            pendenciaDestino.DataEntrada =
                pendenciaDto.DataEntrada;

            pendenciaDestino.Prazo =
                pendenciaDto.Prazo;

            pendenciaDestino.DataSaida =
                pendenciaDto.DataSaida;

            pendenciaDestino.AtribuidoA =
                pendenciaDto.AtribuidoA;

            pendenciaDestino.FaseTrechoId =
                pendenciaDto.FaseTrechoId;

            pendenciaDestino.Historicos =
                (pendenciaDto.Historicos
                    ?? new List<Historico>())
                .Select(
                    h => new Historico
                    {
                        Data = h.Data,
                        Texto = h.Texto
                    }
                )
                .ToList();

            var idsRegionais =
                new List<int>();

            if (
                pendenciaDto.Regionais != null &&
                pendenciaDto.Regionais.Count > 0
            )
            {
                var regionaisEncontradas =
                    await _context.Regionais
                        .Where(
                            r =>
                                pendenciaDto.Regionais
                                    .Contains(r.Codigo)
                        )
                        .ToListAsync();

                idsRegionais =
                    regionaisEncontradas
                        .Select(r => r.IdRegional)
                        .ToList();
            }

            vinculosRegionaisPendentes.Add(
                (
                    pendenciaDestino,
                    idsRegionais
                )
            );
        }

        // Aqui:
        // - UPDATE nas pendências existentes
        // - INSERT somente nas novas
        // - gera ID das novas antes dos vínculos regionais
        await _context.SaveChangesAsync();

        foreach (
            var item
            in vinculosRegionaisPendentes
        )
        {
            foreach (
                var regionalId
                in item.RegionalIds
            )
            {
                _context.PendenciasRegionais.Add(
                    new PendenciaRegional
                    {
                        PendenciaId =
                            item.Pendencia.Id,

                        RegionalId =
                            regionalId
                    }
                );
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = processoExistente.Id,

            trechos =
                mapaTrechosSalvos
                    .Select(t => new
                    {
                        indice = t.Indice,

                        id = t.Trecho.Id,

                        fasesComplementares =
                            t.Complementares
                                .Select(fc => new
                                {
                                    indice =
                                        fc.Indice,

                                    id =
                                        fc.Fase.Id
                                })
                                .ToList()
                    })
                    .ToList()
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProcesso(int id)
    {
        var processo = await _context.Processos

            .Include(p => p.Trechos)
                .ThenInclude(t => t.Fases)

            .Include(p => p.Trechos)
                .ThenInclude(t => t.FasesComplementares)

            .Include(p => p.Pendencias)
                .ThenInclude(p => p.Historicos)

            .Include(p => p.Pendencias)
                .ThenInclude(p => p.PendenciasRegionais)

            .Include(p => p.HistoricosAlteracoes)

            .FirstOrDefaultAsync(p => p.Id == id);


        if (processo == null)
        {
            return NotFound();
        }

        foreach (var pendencia in processo.Pendencias)
        {
            _context.Historicos.RemoveRange(
                pendencia.Historicos ??
                new List<Historico>()
            );


            _context.PendenciasRegionais.RemoveRange(
                pendencia.PendenciasRegionais ??
                new List<PendenciaRegional>()
            );
        }


        _context.Pendencias.RemoveRange(
            processo.Pendencias
        );

        foreach (var trecho in processo.Trechos)
        {
            _context.FasesComplementares.RemoveRange(
                trecho.FasesComplementares ??
                new List<FaseComplementar>()
            );


            _context.FasesTrecho.RemoveRange(
                trecho.Fases ??
                new List<FaseTrecho>()
            );
        }


        _context.Trechos.RemoveRange(
            processo.Trechos
        );

        _context.HistoricosAlteracoes.RemoveRange(
            processo.HistoricosAlteracoes ??
            new List<HistoricoAlteracao>()
        );

        _context.Processos.Remove(
            processo
        );


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
