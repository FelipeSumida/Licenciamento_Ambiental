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
    public DbSet<SirgeoRodovia> SirgeoRodovias => Set<SirgeoRodovia>();
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

        modelBuilder.Entity<SirgeoRodovia>(entity =>
        {
            entity.ToTable("sirgeo_rodovias");

            entity.HasKey(r => r.RodId);

            entity.Property(r => r.RodId)
                .HasColumnName("rod_id");

            entity.Property(r => r.RodCodigo)
                .HasColumnName("rod_codigo");

            entity.Property(r => r.RodKmInicial)
                .HasColumnName("rod_km_inicial");

            entity.Property(r => r.RodKmFinal)
                .HasColumnName("rod_km_final");

            entity.Property(r => r.RodKmExtensao)
                .HasColumnName("rod_km_extensao");
        });

        modelBuilder.Entity<Trecho>(entity =>
        {
            entity.ToTable("Trechos");

            entity.HasKey(t => t.Id);

            entity.Property(t => t.Id)
                .HasColumnName("Id");

            entity.Property(t => t.KmInicial)
                .HasColumnName("KmInicial");

            entity.Property(t => t.KmFinal)
                .HasColumnName("KmFinal");

            entity.Property(t => t.ProcessoId)
                .HasColumnName("ProcessoId");

            entity.Property(t => t.RodId)
                .HasColumnName("rod_id");

            entity.HasOne<Processo>()
                .WithMany(p => p.Trechos)
                .HasForeignKey(t => t.ProcessoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Rodovia)
                .WithMany()
                .HasForeignKey(t => t.RodId)
                .OnDelete(DeleteBehavior.Restrict);
        });

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