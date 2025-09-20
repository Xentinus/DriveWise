using System.Text.Json.Serialization;

public class Vehicle
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("brand")]
    public string Brand { get; set; } = string.Empty;
    
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;
    
    [JsonPropertyName("fuelType")]
    public string FuelType { get; set; } = string.Empty;
    
    [JsonPropertyName("consumption")]
    public double Consumption { get; set; } = 7.0; // L/100km default
    
    [JsonPropertyName("cityConsumption")]
    public double? CityConsumption { get; set; }
    
    [JsonPropertyName("highwayConsumption")]
    public double? HighwayConsumption { get; set; }
    
    [JsonPropertyName("year")]
    public int Year { get; set; }
    
    [JsonPropertyName("licensePlate")]
    public string LicensePlate { get; set; } = string.Empty;
    
    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; } = false;
    
    // Calculate fuel consumption for a given distance in meters
    public double CalculateFuelConsumption(double distanceInMeters, string routeType = "mixed")
    {
        double distanceInKm = distanceInMeters / 1000.0;
        double consumptionPer100Km = Consumption;
        
        return (distanceInKm * consumptionPer100Km) / 100.0;
    }
}