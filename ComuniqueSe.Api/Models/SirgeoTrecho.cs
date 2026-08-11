namespace ComuniqueSe.Api.Models
{
    public class SirgeoTrecho
    {
        public long rtr_id { get; set; }

        public long rod_id { get; set; }

        public long? mun_ibge_id { get; set; }

        public long? jur_id { get; set; }

        public long? adm_id { get; set; }

        public double? rtr_km_inicial { get; set; }

        public double? rtr_km_final { get; set; }

        public double? rtr_km_extensao { get; set; }

        public string? rtr_subtrecho { get; set; }

        public string? rtr_denominacao { get; set; }
    }
}