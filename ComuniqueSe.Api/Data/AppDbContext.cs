using ComuniqueSe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComuniqueSe.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Processo> Processos => Set<Processo>();
    public DbSet<Trecho> Trechos => Set<Trecho>();
    public DbSet<Pendencia> Pendencias => Set<Pendencia>();
    public DbSet<Historico> Historicos => Set<Historico>();
    public DbSet<FaseTrecho> FasesTrecho => Set<FaseTrecho>();
    public DbSet<HistoricoAlteracao> HistoricosAlteracoes => Set<HistoricoAlteracao>();
}