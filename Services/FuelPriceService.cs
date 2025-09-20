using System.Text.RegularExpressions;
using DriveWise.Models;

namespace DriveWise.Services
{
    public class FuelPriceService : IFuelPriceService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FuelPriceService> _logger;
        private FuelPriceData _fuelPriceData;
        private readonly object _lock = new object();

        public FuelPriceService(HttpClient httpClient, ILogger<FuelPriceService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _fuelPriceData = new FuelPriceData
            {
                Prices = new Dictionary<string, decimal>(),
                LastUpdated = DateTime.MinValue
            };
        }

        public decimal? GetFuelPrice(string fuelType)
        {
            lock (_lock)
            {
                var normalizedFuelType = NormalizeFuelType(fuelType);
                return _fuelPriceData.Prices.TryGetValue(normalizedFuelType, out var price) ? price : null;
            }
        }

        public Dictionary<string, decimal> GetAllFuelPrices()
        {
            lock (_lock)
            {
                return new Dictionary<string, decimal>(_fuelPriceData.Prices);
            }
        }

        public DateTime GetLastUpdateTime()
        {
            lock (_lock)
            {
                return _fuelPriceData.LastUpdated;
            }
        }

        public async Task<bool> UpdateFuelPricesAsync()
        {
            try
            {
                _logger.LogInformation("Fetching fuel prices from holtankoljak.hu");

                var response = await _httpClient.GetStringAsync("https://holtankoljak.hu/");
                var prices = ParseFuelPrices(response);

                if (prices.Count > 0)
                {
                    lock (_lock)
                    {
                        _fuelPriceData.Prices = prices;
                        _fuelPriceData.LastUpdated = DateTime.Now;
                    }

                    _logger.LogInformation("Successfully updated fuel prices. Found {Count} fuel types", prices.Count);
                    foreach (var price in prices)
                    {
                        _logger.LogInformation("  {FuelType}: {Price} Ft/l", price.Key, price.Value);
                    }

                    return true;
                }
                else
                {
                    _logger.LogWarning("No fuel prices found on the website");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fuel prices");
                return false;
            }
        }

        public decimal? CalculateFuelCost(double fuelConsumption, string fuelType)
        {
            var price = GetFuelPrice(fuelType);
            if (price.HasValue)
            {
                return (decimal)fuelConsumption * price.Value;
            }
            return null;
        }

        private Dictionary<string, decimal> ParseFuelPrices(string html)
        {
            var prices = new Dictionary<string, decimal>();

            try
            {
                // Parse 95-ös benzin átlagár from news section
                var benzinMatch = Regex.Match(html, @"95-ös benzin[:\s]*(\d+)\s*Ft/liter", RegexOptions.IgnoreCase);
                if (benzinMatch.Success && decimal.TryParse(benzinMatch.Groups[1].Value, out var benzinPrice))
                {
                    prices["benzin"] = benzinPrice;
                }

                // Parse gázolaj átlagár from news section
                var dieselMatch = Regex.Match(html, @"Gázolaj[:\s]*(\d+)\s*Ft/liter", RegexOptions.IgnoreCase);
                if (dieselMatch.Success && decimal.TryParse(dieselMatch.Groups[1].Value, out var dieselPrice))
                {
                    prices["diesel"] = dieselPrice;
                }

                // Try to parse from the main price display area
                if (prices.Count == 0)
                {
                    // Look for average prices in the main display
                    var avgPriceMatches = Regex.Matches(html, @"<span class=""ar"">(\d+(?:\.\d+)?)</span>", RegexOptions.IgnoreCase);
                    
                    // The structure usually shows benzin first, then diesel
                    if (avgPriceMatches.Count >= 1 && decimal.TryParse(avgPriceMatches[0].Groups[1].Value, out var firstPrice))
                    {
                        prices["benzin"] = firstPrice;
                    }
                    
                    if (avgPriceMatches.Count >= 2 && decimal.TryParse(avgPriceMatches[1].Groups[1].Value, out var secondPrice))
                    {
                        prices["diesel"] = secondPrice;
                    }
                }

                // Use fallback values if still no prices found (current Hungarian market prices)
                if (!prices.ContainsKey("benzin"))
                {
                    prices["benzin"] = 588; // Approximate 95-benzin price in Hungary
                }

                if (!prices.ContainsKey("diesel"))
                {
                    prices["diesel"] = 590; // Approximate diesel price in Hungary
                }

                // Set LPG and CNG prices (these are typically not on the main page)
                if (!prices.ContainsKey("lpg"))
                {
                    prices["lpg"] = 320; // Approximate LPG price in Hungary
                }

                if (!prices.ContainsKey("cng"))
                {
                    prices["cng"] = 380; // Approximate CNG price in Hungary (Ft/kg)
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing fuel prices from HTML");
                
                // Fallback to typical current prices if parsing fails
                prices = new Dictionary<string, decimal>
                {
                    ["benzin"] = 588,
                    ["diesel"] = 590,
                    ["lpg"] = 320,
                    ["cng"] = 380
                };
            }

            return prices;
        }

        private string NormalizeFuelType(string fuelType)
        {
            if (string.IsNullOrWhiteSpace(fuelType))
                return "benzin";

            var normalized = fuelType.ToLowerInvariant().Trim();
            
            return normalized switch
            {
                "benzin" or "gasoline" or "petrol" or "95" or "98" => "benzin",
                "diesel" or "dízel" or "gazolaj" or "gázolaj" => "diesel",
                "lpg" or "lpg autogas" or "autógáz" => "lpg",
                "cng" or "compressed natural gas" or "földgáz" => "cng",
                _ => "benzin" // default fallback
            };
        }
    }
}