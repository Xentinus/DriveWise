using DriveWise.Models;
using System.Text.Json;

namespace DriveWise.Services
{
    public interface IWeatherService
    {
        Task<WeatherData?> GetWeatherByCoordinatesAsync(double latitude, double longitude);
    }

    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _apiKey;
        private const string BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

        public WeatherService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _apiKey = _configuration["OpenWeatherMap:ApiKey"] ?? "";
        }

        public async Task<WeatherData?> GetWeatherByCoordinatesAsync(double latitude, double longitude)
        {
            try
            {
                // Return null if no valid API key is configured
                if (string.IsNullOrEmpty(_apiKey) || 
                    _apiKey == "demo_key" || 
                    _apiKey == "demo_key_replace_with_real_api_key" ||
                    _apiKey == "YOUR_ACTUAL_API_KEY_HERE")
                {
                    Console.WriteLine("No valid API key configured - weather data not available");
                    return null;
                }

                var url = $"{BASE_URL}?lat={latitude}&lon={longitude}&appid={_apiKey}&units=metric&lang=hu";
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"OpenWeatherMap API error: {response.StatusCode} - {response.ReasonPhrase}");
                    return null;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<WeatherApiResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (apiResponse?.Weather?.Length > 0)
                {
                    return new WeatherData
                    {
                        Temperature = Math.Round(apiResponse.Main.Temp, 1),
                        Condition = apiResponse.Weather[0].Main,
                        Description = apiResponse.Weather[0].Description,
                        Icon = apiResponse.Weather[0].Icon,
                        Humidity = apiResponse.Main.Humidity,
                        WindSpeed = apiResponse.Wind.Speed,
                        LocationName = apiResponse.Name,
                        LastUpdated = DateTime.UtcNow
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Weather service error: {ex.Message}");
                return null;
            }
        }
    }
}