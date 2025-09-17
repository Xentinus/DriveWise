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
            _apiKey = _configuration["OpenWeatherMap:ApiKey"] ?? "demo_key";
        }

        public async Task<WeatherData?> GetWeatherByCoordinatesAsync(double latitude, double longitude)
        {
            try
            {
                // If demo API key, return mock data
                if (_apiKey == "demo_key" || _apiKey == "demo_key_replace_with_real_api_key")
                {
                    return CreateMockWeatherData(latitude, longitude);
                }

                var url = $"{BASE_URL}?lat={latitude}&lon={longitude}&appid={_apiKey}&units=metric&lang=hu";
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    // Fallback to mock data if API fails
                    return CreateMockWeatherData(latitude, longitude);
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

                return CreateMockWeatherData(latitude, longitude);
            }
            catch (Exception)
            {
                // Log the exception in a real application
                return CreateMockWeatherData(latitude, longitude);
            }
        }

        private WeatherData CreateMockWeatherData(double latitude, double longitude)
        {
            // Create realistic mock data based on coordinates and current time
            var random = new Random();
            var hour = DateTime.Now.Hour;
            
            // Base temperature varies by location (rough approximation)
            var baseTemp = latitude > 50 ? 5 : (latitude > 40 ? 15 : 25);
            var temperature = baseTemp + random.Next(-5, 8);
            
            // More clouds/rain in afternoon/evening
            var conditions = new[] { "Clear", "Clouds", "Rain", "Drizzle" };
            var weights = hour > 12 && hour < 18 ? new[] { 0.3, 0.4, 0.2, 0.1 } : new[] { 0.5, 0.3, 0.15, 0.05 };
            
            var condition = GetRandomWeightedChoice(conditions, weights, random);
            var descriptions = new Dictionary<string, string[]>
            {
                ["Clear"] = new[] { "tiszta ég", "napos", "derült" },
                ["Clouds"] = new[] { "felhős", "változóan felhős", "borult" },
                ["Rain"] = new[] { "eső", "zápor", "esős" },
                ["Drizzle"] = new[] { "szitálás", "ködszitálás", "gyenge eső" }
            };

            var locationName = GetLocationName(latitude, longitude);

            return new WeatherData
            {
                Temperature = temperature,
                Condition = condition,
                Description = descriptions[condition][random.Next(descriptions[condition].Length)],
                Icon = GetMockIcon(condition),
                Humidity = random.Next(40, 90),
                WindSpeed = random.Next(0, 15),
                LocationName = locationName,
                LastUpdated = DateTime.UtcNow
            };
        }

        private string GetRandomWeightedChoice(string[] choices, double[] weights, Random random)
        {
            var totalWeight = weights.Sum();
            var randomValue = random.NextDouble() * totalWeight;
            
            for (int i = 0; i < choices.Length; i++)
            {
                randomValue -= weights[i];
                if (randomValue <= 0)
                    return choices[i];
            }
            
            return choices[0];
        }

        private string GetMockIcon(string condition)
        {
            return condition switch
            {
                "Clear" => "01d",
                "Clouds" => "03d",
                "Rain" => "10d",
                "Drizzle" => "09d",
                _ => "01d"
            };
        }

        private string GetLocationName(double latitude, double longitude)
        {
            // Simple approximation based on coordinates
            if (Math.Abs(latitude - 47.4979) < 0.1 && Math.Abs(longitude - 19.0402) < 0.1)
                return "Budapest";
            if (Math.Abs(latitude - 47.5316) < 0.1 && Math.Abs(longitude - 21.6273) < 0.1)
                return "Debrecen";
            if (Math.Abs(latitude - 46.2530) < 0.1 && Math.Abs(longitude - 20.1414) < 0.1)
                return "Szeged";
            if (Math.Abs(latitude - 47.9040) < 0.1 && Math.Abs(longitude - 21.7292) < 0.1)
                return "Nyíregyháza";
            
            return "Ismeretlen helység";
        }
    }
}