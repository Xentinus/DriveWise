using DriveWise.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DriveWise.Services
{
    public class RoutingService : IRoutingService
    {
        private readonly HttpClient _httpClient;
        private readonly IVehicleService _vehicleService;
        private readonly ILocationService _locationService;
        private const string OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

        public RoutingService(HttpClient httpClient, IVehicleService vehicleService, ILocationService locationService)
        {
            _httpClient = httpClient;
            _vehicleService = vehicleService;
            _locationService = locationService;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "DriveWise/1.0");
        }

        public async Task<RouteResult?> CalculateRouteAsync(double fromLat, double fromLon, double toLat, double toLon, Vehicle? vehicle = null)
        {
            try
            {
                // Format coordinates for OSRM (longitude,latitude format)
                var fromCoord = $"{fromLon.ToString(System.Globalization.CultureInfo.InvariantCulture)},{fromLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
                var toCoord = $"{toLon.ToString(System.Globalization.CultureInfo.InvariantCulture)},{toLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
                
                var url = $"{OSRM_BASE_URL}/{fromCoord};{toCoord}?overview=full&geometries=geojson&steps=true";
                
                Console.WriteLine($"[RoutingService] Requesting route from OSRM: {url}");
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"OSRM routing API error: {response.StatusCode} - {response.ReasonPhrase}");
                    return null;
                }
                
                var jsonString = await response.Content.ReadAsStringAsync();
                var osrmResponse = JsonSerializer.Deserialize<OSRMResponse>(jsonString, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });
                
                if (osrmResponse?.Routes?.Count > 0)
                {
                    var route = osrmResponse.Routes[0];
                    
                    // Calculate fuel consumption
                    var effectiveVehicle = vehicle ?? _vehicleService.GetDefaultVehicle();
                    var fuelConsumption = _vehicleService.CalculateFuelConsumption(route.Distance, effectiveVehicle);
                    
                    // Get elevation data for start and end points
                    double? startElevation = null;
                    double? endElevation = null;
                    double? elevationDifference = null;
                    
                    try
                    {
                        var startLocationTask = _locationService.GetLocationDetailsAsync(fromLat, fromLon);
                        var endLocationTask = _locationService.GetLocationDetailsAsync(toLat, toLon);
                        
                        await Task.WhenAll(startLocationTask, endLocationTask);
                        
                        var startLocation = await startLocationTask;
                        var endLocation = await endLocationTask;
                        
                        startElevation = startLocation?.Elevation;
                        endElevation = endLocation?.Elevation;
                        
                        if (startElevation.HasValue && endElevation.HasValue)
                        {
                            elevationDifference = endElevation.Value - startElevation.Value;
                        }
                        
                        Console.WriteLine($"[RoutingService] Elevation data: Start={startElevation}m, End={endElevation}m, Difference={elevationDifference}m");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[RoutingService] Error fetching elevation data: {ex.Message}");
                    }
                    
                    return new RouteResult
                    {
                        Geometry = route.Geometry,
                        Distance = route.Distance,
                        Duration = route.Duration,
                        FuelConsumption = fuelConsumption,
                        VehicleUsed = effectiveVehicle.Name ?? "Alapértelmezett jármű",
                        StartElevation = startElevation,
                        EndElevation = endElevation,
                        ElevationDifference = elevationDifference,
                        Steps = route.Legs?.SelectMany(leg => leg.Steps?.Select(step => new RouteStep
                        {
                            Instruction = step.Maneuver?.Instruction ?? "Folytatás",
                            Distance = step.Distance,
                            Duration = step.Duration,
                            Geometry = step.Geometry
                        }) ?? Enumerable.Empty<RouteStep>()).ToList() ?? new List<RouteStep>()
                    };
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in route calculation: {ex.Message}");
                return null;
            }
        }
    }

    // DTOs for OSRM API responses
    public class OSRMResponse
    {
        public List<OSRMRoute>? Routes { get; set; }
        public string? Code { get; set; }
    }

    public class OSRMRoute
    {
        public RouteGeometry? Geometry { get; set; }
        public double Distance { get; set; }
        public double Duration { get; set; }
        public List<OSRMLeg>? Legs { get; set; }
    }

    public class OSRMLeg
    {
        public List<OSRMStep>? Steps { get; set; }
        public double Distance { get; set; }
        public double Duration { get; set; }
    }

    public class OSRMStep
    {
        public RouteGeometry? Geometry { get; set; }
        public OSRMManeuver? Maneuver { get; set; }
        public double Distance { get; set; }
        public double Duration { get; set; }
    }

    public class OSRMManeuver
    {
        public string? Instruction { get; set; }
        public string? Type { get; set; }
    }
}