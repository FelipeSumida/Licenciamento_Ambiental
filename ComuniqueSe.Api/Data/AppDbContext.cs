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
    public DbSet<SirgeoTrecho> SirgeoTrechos => Set<SirgeoTrecho>();
    public DbSet<Municipio> Municipios => Set<Municipio>();
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

        modelBuilder.Entity<Processo>(entity =>
        {
            entity.ToTable("Processos");

            entity.Property(p => p.IdEmpreendimento)
                .HasColumnName("id_empreendimento")
                .HasMaxLength(20)
                .IsUnicode(false)
                .IsRequired();
            
            entity.HasIndex(p => p.IdEmpreendimento)
                .IsUnique();
        });

        modelBuilder.Entity<FaseTrecho>(entity =>
        {
            entity.ToTable("FasesTrecho");

            entity.Property(f => f.NumeroProcesso)
                .HasColumnName("NumeroProcesso")
                .HasMaxLength(100)
                .IsUnicode(false)
                .IsRequired(false);
        });

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

        modelBuilder.Entity<SirgeoTrecho>(entity =>
        {
            entity.ToTable("sirgeo_trechos");

            entity.HasKey(e => e.rtr_id);

            entity.Property(e => e.rtr_id)
                .HasColumnName("rtr_id");

            entity.Property(e => e.rod_id)
                .HasColumnName("rod_id");

            entity.Property(e => e.rtr_km_inicial)
                .HasColumnName("rtr_km_inicial");

            entity.Property(e => e.rtr_km_final)
                .HasColumnName("rtr_km_final");

            entity.Property(e => e.rtr_km_extensao)
                .HasColumnName("rtr_km_extensao");

            entity.Property(e => e.rtr_subtrecho)
                .HasColumnName("rtr_subtrecho");

            entity.Property(e => e.rtr_denominacao)
                .HasColumnName("rtr_denominacao");
        });

        modelBuilder.Entity<Municipio>(entity =>
        {
            entity.ToTable("municipio");

            entity.HasKey(m => m.mun_ibge_id);

            entity.Property(m => m.mun_ibge_id)
                .HasColumnName("mun_ibge_id");

            entity.Property(m => m.nome)
                .HasColumnName("nome");

            entity.Property(m => m.id_regional)
                .HasColumnName("id_regional");

            entity.Property(m => m.id_reg_adm)
                .HasColumnName("id_reg_adm");

            entity.Property(m => m.id_reg_gov)
                .HasColumnName("id_reg_gov");
        });

        modelBuilder.Entity<FaseComplementar>()
            .HasOne(fc => fc.Trecho)
            .WithMany(t => t.FasesComplementares)
            .HasForeignKey(fc => fc.TrechoId)
            .OnDelete(DeleteBehavior.NoAction);


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

        modelBuilder.Entity<Pendencia>()
            .HasOne(p => p.FaseTrecho)
            .WithMany()
            .HasForeignKey(p => p.FaseTrechoId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}