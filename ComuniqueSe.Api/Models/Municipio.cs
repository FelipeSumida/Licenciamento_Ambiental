namespace ComuniqueSe.Api.Models
{
    public class Municipio
    {
        public long mun_ibge_id { get; set; }

        public string? nome { get; set; }

        public int id_regional { get; set; }

        public long? id_reg_adm { get; set; }

        public long? id_reg_gov { get; set; }
    }
}