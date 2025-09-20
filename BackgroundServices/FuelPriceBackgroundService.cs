using DriveWise.Services;

namespace DriveWise.BackgroundServices
{
    public class FuelPriceBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<FuelPriceBackgroundService> _logger;
        private readonly TimeSpan _updateInterval = TimeSpan.FromHours(24); // Update daily

        public FuelPriceBackgroundService(IServiceProvider serviceProvider, ILogger<FuelPriceBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Fuel Price Background Service started");

            // Initial update on startup
            await UpdateFuelPrices();

            // Schedule daily updates
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_updateInterval, stoppingToken);
                    await UpdateFuelPrices();
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Fuel Price Background Service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Fuel Price Background Service");
                }
            }
        }

        private async Task UpdateFuelPrices()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var fuelPriceService = scope.ServiceProvider.GetRequiredService<IFuelPriceService>();
                
                var success = await fuelPriceService.UpdateFuelPricesAsync();
                if (success)
                {
                    _logger.LogInformation("Fuel prices updated successfully at {Time}", DateTime.Now);
                }
                else
                {
                    _logger.LogWarning("Failed to update fuel prices at {Time}", DateTime.Now);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fuel prices in background service");
            }
        }
    }
}