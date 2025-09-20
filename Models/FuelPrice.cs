using System.Text.Json.Serialization;

namespace DriveWise.Models
{
    public class FuelPrice
    {
        [JsonPropertyName("fuelType")]
        public string FuelType { get; set; } = string.Empty;
        
        [JsonPropertyName("price")]
        public decimal Price { get; set; } // Ft/liter
        
        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; }
    }

    public class FuelPriceData
    {
        [JsonPropertyName("prices")]
        public Dictionary<string, decimal> Prices { get; set; } = new Dictionary<string, decimal>();
        
        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; }
        
        [JsonPropertyName("source")]
        public string Source { get; set; } = "holtankoljak.hu";
    }

    public enum FuelType
    {
        Benzin = 0,     // Regular gasoline
        Diesel = 1,     // Diesel
        LPG = 2,        // LPG
        CNG = 3         // Compressed Natural Gas
    }
}