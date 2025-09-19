using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;
using DriveWise.Models;
using System.Text.Json.Serialization;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoutingController : ControllerBase
    {
        private readonly IRoutingService _routingService;
        private readonly IVehicleService _vehicleService;

        public RoutingController(IRoutingService routingService, IVehicleService vehicleService)
        {
            _routingService = routingService;
            _vehicleService = vehicleService;
        }

        [HttpGet("route")]
        public async Task<IActionResult> CalculateRoute(
            [FromQuery] double fromLat, 
            [FromQuery] double fromLon, 
            [FromQuery] double toLat, 
            [FromQuery] double toLon,
            [FromQuery] string? vehicleId = null)
        {
            if (fromLat < -90 || fromLat > 90 || fromLon < -180 || fromLon > 180 ||
                toLat < -90 || toLat > 90 || toLon < -180 || toLon > 180)
            {
                return BadRequest("Invalid coordinates");
            }

            // For now, we'll use the default vehicle since vehicle data comes from frontend storage
            // The frontend will need to pass vehicle data or we can enhance this later
            Vehicle? vehicle = null;
            
            var route = await _routingService.CalculateRouteAsync(fromLat, fromLon, toLat, toLon, vehicle);
            
            if (route == null)
            {
                return NotFound("Route not available");
            }

            return Ok(route);
        }

        [HttpPost("route")]
        public async Task<IActionResult> CalculateRouteWithVehicle(
            [FromBody] RouteRequest request)
        {
            Console.WriteLine($"[RoutingController] POST route request received");
            
            if (request == null)
            {
                Console.WriteLine($"[RoutingController] Request is null");
                return BadRequest("Request data is required");
            }

            Console.WriteLine($"[RoutingController] Route request: FromLat={request.FromLat}, FromLon={request.FromLon}, ToLat={request.ToLat}, ToLon={request.ToLon}");
            Console.WriteLine($"[RoutingController] Vehicle: {(request.Vehicle != null ? $"{request.Vehicle.Name} (ID: {request.Vehicle.Id})" : "null")}");

            if (request.FromLat < -90 || request.FromLat > 90 || request.FromLon < -180 || request.FromLon > 180 ||
                request.ToLat < -90 || request.ToLat > 90 || request.ToLon < -180 || request.ToLon > 180)
            {
                Console.WriteLine($"[RoutingController] Invalid coordinates");
                return BadRequest("Invalid coordinates");
            }

            var route = await _routingService.CalculateRouteAsync(request.FromLat, request.FromLon, request.ToLat, request.ToLon, request.Vehicle);
            
            if (route == null)
            {
                Console.WriteLine($"[RoutingController] Route calculation returned null");
                return NotFound("Route not available");
            }

            Console.WriteLine($"[RoutingController] Route calculated successfully: {route.Distance}m, {route.Duration}s, fuel: {route.FuelConsumption}L");
            return Ok(route);
        }
    }

    public class RouteRequest
    {
        [JsonPropertyName("fromLat")]
        public double FromLat { get; set; }
        
        [JsonPropertyName("fromLon")]
        public double FromLon { get; set; }
        
        [JsonPropertyName("toLat")]
        public double ToLat { get; set; }
        
        [JsonPropertyName("toLon")]
        public double ToLon { get; set; }
        
        [JsonPropertyName("vehicle")]
        public Vehicle? Vehicle { get; set; }
    }
}