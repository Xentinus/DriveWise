using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FuelPriceController : ControllerBase
    {
        private readonly IFuelPriceService _fuelPriceService;
        private readonly ILogger<FuelPriceController> _logger;

        public FuelPriceController(IFuelPriceService fuelPriceService, ILogger<FuelPriceController> logger)
        {
            _fuelPriceService = fuelPriceService;
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<object> GetFuelPrices()
        {
            var prices = _fuelPriceService.GetAllFuelPrices();
            var lastUpdate = _fuelPriceService.GetLastUpdateTime();

            return Ok(new
            {
                Prices = prices,
                LastUpdated = lastUpdate,
                IsDataAvailable = prices.Count > 0
            });
        }

        [HttpGet("{fuelType}")]
        public ActionResult<object> GetFuelPrice(string fuelType)
        {
            var price = _fuelPriceService.GetFuelPrice(fuelType);
            
            if (price == null)
            {
                return NotFound(new { Message = $"Price for fuel type '{fuelType}' not found" });
            }

            return Ok(new
            {
                FuelType = fuelType,
                Price = price,
                Currency = "Ft/l"
            });
        }

        [HttpPost("update")]
        public async Task<ActionResult<object>> UpdateFuelPrices()
        {
            _logger.LogInformation("Manual fuel price update requested");
            
            var success = await _fuelPriceService.UpdateFuelPricesAsync();
            
            if (success)
            {
                var prices = _fuelPriceService.GetAllFuelPrices();
                var lastUpdate = _fuelPriceService.GetLastUpdateTime();
                
                return Ok(new
                {
                    Message = "Fuel prices updated successfully",
                    Prices = prices,
                    LastUpdated = lastUpdate
                });
            }
            else
            {
                return StatusCode(500, new { Message = "Failed to update fuel prices" });
            }
        }

        [HttpPost("calculate-cost")]
        public ActionResult<object> CalculateFuelCost([FromBody] FuelCostRequest request)
        {
            if (request.FuelConsumption <= 0)
            {
                return BadRequest(new { Message = "Fuel consumption must be greater than 0" });
            }

            var cost = _fuelPriceService.CalculateFuelCost(request.FuelConsumption, request.FuelType);
            var price = _fuelPriceService.GetFuelPrice(request.FuelType);

            if (cost == null)
            {
                return NotFound(new { Message = $"Price for fuel type '{request.FuelType}' not found" });
            }

            return Ok(new
            {
                FuelType = request.FuelType,
                FuelConsumption = request.FuelConsumption,
                PricePerLiter = price,
                TotalCost = cost,
                Currency = "Ft"
            });
        }
    }

    public class FuelCostRequest
    {
        public double FuelConsumption { get; set; }
        public string FuelType { get; set; } = "benzin";
    }
}