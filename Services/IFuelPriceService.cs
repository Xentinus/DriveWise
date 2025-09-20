using DriveWise.Models;

namespace DriveWise.Services
{
    public interface IFuelPriceService
    {
        /// <summary>
        /// Get current fuel price for a specific fuel type
        /// </summary>
        /// <param name="fuelType">Fuel type (benzin, diesel, lpg, cng)</param>
        /// <returns>Price in Ft/liter or null if not available</returns>
        decimal? GetFuelPrice(string fuelType);
        
        /// <summary>
        /// Get all current fuel prices
        /// </summary>
        /// <returns>Dictionary of fuel type and price in Ft/liter</returns>
        Dictionary<string, decimal> GetAllFuelPrices();
        
        /// <summary>
        /// Get the last update time of fuel prices
        /// </summary>
        /// <returns>DateTime of last update</returns>
        DateTime GetLastUpdateTime();
        
        /// <summary>
        /// Manually trigger fuel price update
        /// </summary>
        /// <returns>True if update was successful</returns>
        Task<bool> UpdateFuelPricesAsync();
        
        /// <summary>
        /// Calculate fuel cost for given consumption and fuel type
        /// </summary>
        /// <param name="fuelConsumption">Fuel consumption in liters</param>
        /// <param name="fuelType">Fuel type</param>
        /// <returns>Cost in Ft or null if price not available</returns>
        decimal? CalculateFuelCost(double fuelConsumption, string fuelType);
    }
}