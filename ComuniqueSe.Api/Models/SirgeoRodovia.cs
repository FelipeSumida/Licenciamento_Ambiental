using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComuniqueSe.Api.Models;

[Table("sirgeo_rodovias")]
public class SirgeoRodovia
{
    [Key]
    [Column("rod_id")]
    public long RodId { get; set; }

    [Column("rod_codigo")]
    public string RodCodigo { get; set; } = string.Empty;

    [Column("rod_km_inicial")]
    public double? RodKmInicial { get; set; }

    [Column("rod_km_final")]
    public double? RodKmFinal { get; set; }

    [Column("rod_km_extensao")]
    public double? RodKmExtensao { get; set; }
}