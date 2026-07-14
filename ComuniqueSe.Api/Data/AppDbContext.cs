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
    public DbSet<Regional> Regionais => Set<Regional>();
    public DbSet<PendenciaRegional> PendenciasRegionais =>
        Set<PendenciaRegional>();
    public DbSet<Pendencia> Pendencias => Set<Pendencia>();
    public DbSet<Historico> Historicos => Set<Historico>();
    public DbSet<FaseTrecho> FasesTrecho => Set<FaseTrecho>();
    public DbSet<HistoricoAlteracao> HistoricosAlteracoes => Set<HistoricoAlteracao>();
    public DbSet<FaseComplementar> FasesComplementares => Set<FaseComplementar>();
    

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<FaseComplementar>()
            .HasOne(fc => fc.Processo)
            .WithMany(p => p.FasesComplementares)
            .HasForeignKey(fc => fc.ProcessoId);


        modelBuilder.Entity<Regional>(entity =>
        {
            entity.ToTable("Regional");

            entity.HasKey(r => r.IdRegional);

            entity.Property(r => r.IdRegional)
                .HasColumnName("id_regional");

            entity.Property(r => r.Nome)
                .HasColumnName("nome")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(r => r.Codigo)
                .HasColumnName("codigo")
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(r => r.Codigo)
                .IsUnique();
        });

        modelBuilder.Entity<PendenciaRegional>(entity =>
        {
            entity.ToTable("PendenciasRegionais");

            entity.HasKey(pr => pr.Id);

            entity.Property(pr => pr.Id)
                .HasColumnName("Id");

            entity.Property(pr => pr.PendenciaId)
                .HasColumnName("PendenciaId");

            entity.Property(pr => pr.RegionalId)
                .HasColumnName("RegionalId");

            entity.HasIndex(pr => new
            {
                pr.PendenciaId,
                pr.RegionalId
            }).IsUnique();

            entity.HasOne(pr => pr.Pendencia)
                .WithMany(p => p.PendenciasRegionais)
                .HasForeignKey(pr => pr.PendenciaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pr => pr.Regional)
                .WithMany(r => r.PendenciasRegionais)
                .HasForeignKey(pr => pr.RegionalId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}