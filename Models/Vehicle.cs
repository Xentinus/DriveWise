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
        
        // Use specific consumption based on route type if available
        switch (routeType.ToLower())
        {
            case "city":
                consumptionPer100Km = CityConsumption ?? Consumption;
                break;
            case "highway":
                consumptionPer100Km = HighwayConsumption ?? Consumption;
                break;
            default:
                // For mixed routes, use average if specific consumptions are available
                if (CityConsumption.HasValue && HighwayConsumption.HasValue)
                {
                    consumptionPer100Km = (CityConsumption.Value + HighwayConsumption.Value) / 2.0;
                }
                break;
        }
        
        return (distanceInKm * consumptionPer100Km) / 100.0;
    }
}