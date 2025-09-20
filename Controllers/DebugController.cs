using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;
using DriveWise.Models;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        private readonly IRoutingService _routingService;
        private readonly IFuelPriceService _fuelPriceService;

        public DebugController(IRoutingService routingService, IFuelPriceService fuelPriceService)
        {
            _routingService = routingService;
            _fuelPriceService = fuelPriceService;
        }

        [HttpGet("test-fuel")]
        public ActionResult<object> TestFuel()
        {
            var prices = _fuelPriceService.GetAllFuelPrices();
            var benzinPrice = _fuelPriceService.GetFuelPrice("benzin");
            var petrolPrice = _fuelPriceService.GetFuelPrice("petrol");
            var fuelCost = _fuelPriceService.CalculateFuelCost(0.267505, "benzin");

            return Ok(new
            {
                AllPrices = prices,
                BenzinPrice = benzinPrice,
                PetrolPrice = petrolPrice,
                TestFuelCost = fuelCost,
                Message = "Fuel price service test"
            });
        }

        [HttpGet("test-route")]
        public async Task<ActionResult<object>> TestRoute()
        {
            var testVehicle = new Vehicle
            {
                Id = "debug",
                Name = "Debug autó",
                FuelType = "benzin",
                Consumption = 7.0
            };

            var route = await _routingService.CalculateRouteAsync(47.4979, 19.0402, 47.5, 19.05, testVehicle);

            return Ok(new
            {
                RouteExists = route != null,
                Distance = route?.Distance,
                Duration = route?.Duration,
                FuelConsumption = route?.FuelConsumption,
                FuelCost = route?.FuelCost,
                FuelPrice = route?.FuelPrice,
                FuelType = route?.FuelType,
                VehicleUsed = route?.VehicleUsed,
                Message = "Route calculation test"
            });
        }

        [HttpGet("simulate-frontend-data")]
        public async Task<ActionResult<object>> SimulateFrontendData()
        {
            var testVehicle = new Vehicle
            {
                Id = "frontend-test",
                Name = "Frontend teszt autó",
                FuelType = "benzin",
                Consumption = 7.0
            };

            var route = await _routingService.CalculateRouteAsync(47.4979, 19.0402, 47.5, 19.05, testVehicle);

            if (route == null)
            {
                return NotFound("Route not found");
            }

            // Simulate the data structure that navigation.js sends to RouteCard
            var frontendData = new
            {
                destination = "Test destination",
                distance = route.Distance,
                duration = route.Duration,
                fuelConsumption = route.FuelConsumption,
                vehicleUsed = route.VehicleUsed,
                startElevation = route.StartElevation,
                endElevation = route.EndElevation,
                elevationDifference = route.ElevationDifference,
                fuelCost = route.FuelCost,
                fuelPrice = route.FuelPrice,
                fuelType = route.FuelType,
                geometry = new { type = "test" }
            };

            return Ok(new
            {
                Message = "Frontend data simulation",
                Data = frontendData,
                HasFuelCost = route.FuelCost.HasValue,
                HasFuelPrice = route.FuelPrice.HasValue,
                FuelTypeNotNull = !string.IsNullOrEmpty(route.FuelType)
            });
        }
    }
}