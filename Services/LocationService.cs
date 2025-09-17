using DriveWise.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DriveWise.Services
{
    public class LocationService : ILocationService
    {
        private readonly HttpClient _httpClient;
        private const string NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
        private const string ELEVATION_BASE_URL = "https://api.open-elevation.com/api/v1";

        public LocationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "DriveWise/1.0");
        }

        public async Task<List<LocationSearchResult>> SearchLocationsAsync(string query, int limit = 5)
        {
            try
            {
                var encodedQuery = Uri.EscapeDataString(query);
                var url = $"{NOMINATIM_BASE_URL}/search?format=json&q={encodedQuery}&limit={limit}&countrycodes=HU&addressdetails=1&extratags=1&namedetails=1&accept-language=hu,en";
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Nominatim search API error: {response.StatusCode} - {response.ReasonPhrase}");
                    return new List<LocationSearchResult>();
                }
                
                var jsonString = await response.Content.ReadAsStringAsync();
                var nominatimResults = JsonSerializer.Deserialize<List<NominatimSearchResult>>(jsonString, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });
                
                return nominatimResults?.Select(MapToLocationSearchResult).ToList() ?? new List<LocationSearchResult>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in location search: {ex.Message}");
                return new List<LocationSearchResult>();
            }
        }

        public async Task<LocationDetails?> GetLocationDetailsAsync(double latitude, double longitude)
        {
            try
            {
                // Get location details from Nominatim
                var nominatimUrl = $"{NOMINATIM_BASE_URL}/reverse?format=json&lat={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=hu,en";
                
                var nominatimTask = _httpClient.GetAsync(nominatimUrl);
                
                // Get elevation data
                var elevationUrl = $"{ELEVATION_BASE_URL}/lookup?locations={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)},{longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
                var elevationTask = _httpClient.GetAsync(elevationUrl);
                
                await Task.WhenAll(nominatimTask, elevationTask);
                
                var nominatimResponse = await nominatimTask;
                var elevationResponse = await elevationTask;
                
                if (!nominatimResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Nominatim reverse API error: {nominatimResponse.StatusCode} - {nominatimResponse.ReasonPhrase}");
                    Console.WriteLine($"Request URL: {nominatimUrl}");
                    return null;
                }
                
                var nominatimJson = await nominatimResponse.Content.ReadAsStringAsync();
                var nominatimResult = JsonSerializer.Deserialize<NominatimReverseResult>(nominatimJson, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });
                
                double? elevation = null;
                if (elevationResponse.IsSuccessStatusCode)
                {
                    var elevationJson = await elevationResponse.Content.ReadAsStringAsync();
                    var elevationResult = JsonSerializer.Deserialize<ElevationResponse>(elevationJson, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });
                    
                    elevation = elevationResult?.Results?.FirstOrDefault()?.Elevation;
                }
                
                return nominatimResult != null ? MapToLocationDetails(nominatimResult, elevation) : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in location details: {ex.Message}");
                return null;
            }
        }

        private LocationSearchResult MapToLocationSearchResult(NominatimSearchResult result)
        {
            return new LocationSearchResult
            {
                DisplayName = result.DisplayName ?? "",
                Latitude = double.Parse(result.Lat ?? "0", System.Globalization.CultureInfo.InvariantCulture),
                Longitude = double.Parse(result.Lon ?? "0", System.Globalization.CultureInfo.InvariantCulture),
                Address = result.Address != null ? MapToLocationAddress(result.Address) : null
            };
        }

        private LocationDetails MapToLocationDetails(NominatimReverseResult result, double? elevation)
        {
            return new LocationDetails
            {
                DisplayName = result.DisplayName ?? "",
                Latitude = double.Parse(result.Lat ?? "0", System.Globalization.CultureInfo.InvariantCulture),
                Longitude = double.Parse(result.Lon ?? "0", System.Globalization.CultureInfo.InvariantCulture),
                Address = result.Address != null ? MapToLocationAddress(result.Address) : null,
                Elevation = elevation
            };
        }

        private LocationAddress MapToLocationAddress(NominatimAddress address)
        {
            return new LocationAddress
            {
                HouseNumber = address.HouseNumber ?? "",
                Road = address.Road ?? address.Street ?? "",
                Neighbourhood = address.Neighbourhood ?? address.Suburb ?? "",
                City = address.City ?? address.Town ?? address.Village ?? "",
                Postcode = address.Postcode ?? "",
                State = address.State ?? "",
                Country = address.Country ?? ""
            };
        }
    }

    // DTOs for Nominatim API responses
    public class NominatimSearchResult
    {
        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }
        public string? Lat { get; set; }
        public string? Lon { get; set; }
        public NominatimAddress? Address { get; set; }
    }

    public class NominatimReverseResult
    {
        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }
        public string? Lat { get; set; }
        public string? Lon { get; set; }
        public NominatimAddress? Address { get; set; }
    }

    public class NominatimAddress
    {
        [JsonPropertyName("house_number")]
        public string? HouseNumber { get; set; }
        public string? Road { get; set; }
        public string? Street { get; set; }
        public string? Neighbourhood { get; set; }
        public string? Suburb { get; set; }
        public string? City { get; set; }
        public string? Town { get; set; }
        public string? Village { get; set; }
        public string? Postcode { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
    }

    public class ElevationResponse
    {
        public List<ElevationResult>? Results { get; set; }
    }

    public class ElevationResult
    {
        public double? Elevation { get; set; }
    }
}