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
        private readonly IRouteShareService _routeShareService;

        public RoutingController(IRoutingService routingService, IVehicleService vehicleService, IRouteShareService routeShareService)
        {
            _routingService = routingService;
            _vehicleService = vehicleService;
            _routeShareService = routeShareService;
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
                return BadRequest("Érvénytelen koordináták");
            }

            // For now, we'll use the default vehicle since vehicle data comes from frontend storage
            // The frontend will need to pass vehicle data or we can enhance this later
            Vehicle? vehicle = null;
            
            var route = await _routingService.CalculateRouteAsync(fromLat, fromLon, toLat, toLon, vehicle);
            
            if (route == null)
            {
                return NotFound("Útvonal nem elérhet?");
            }

            // Generate shareable link
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            route.ShareableLink = _routeShareService.GenerateShareableLink(fromLat, fromLon, toLat, toLon, baseUrl);

            return Ok(route);
        }

        [HttpPost("route")]
        public async Task<IActionResult> CalculateRouteWithVehicle(
            [FromBody] RouteRequest request)
        {
            Console.WriteLine($"[RoutingController] POST útvonal kérés érkezett");
            
            if (request == null)
            {
                Console.WriteLine($"[RoutingController] Kérés null");
                return BadRequest("Kérési adatok szükségesek");
            }

            Console.WriteLine($"[RoutingController] Útvonal kérés: FromLat={request.FromLat}, FromLon={request.FromLon}, ToLat={request.ToLat}, ToLon={request.ToLon}");
            Console.WriteLine($"[RoutingController] Járm?: {(request.Vehicle != null ? $"{request.Vehicle.Name} (ID: {request.Vehicle.Id})" : "null")}");

            if (request.FromLat < -90 || request.FromLat > 90 || request.FromLon < -180 || request.FromLon > 180 ||
                request.ToLat < -90 || request.ToLat > 90 || request.ToLon < -180 || request.ToLon > 180)
            {
                Console.WriteLine($"[RoutingController] Érvénytelen koordináták");
                return BadRequest("Érvénytelen koordináták");
            }

            var route = await _routingService.CalculateRouteAsync(request.FromLat, request.FromLon, request.ToLat, request.ToLon, request.Vehicle);
            
            if (route == null)
            {
                Console.WriteLine($"[RoutingController] Útvonal számítás null eredményt adott");
                return NotFound("Útvonal nem elérhet?");
            }

            // Generate shareable link
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            route.ShareableLink = _routeShareService.GenerateShareableLink(request.FromLat, request.FromLon, request.ToLat, request.ToLon, baseUrl);

            Console.WriteLine($"[RoutingController] Útvonal sikeresen kiszámítva: {route.Distance}m, {route.Duration}s, üzemanyag: {route.FuelConsumption}L");
            Console.WriteLine($"[RoutingController] Megosztható link generálva: {route.ShareableLink}");
            
            return Ok(route);
        }

        [HttpGet("shared/{shareId}")]
        public async Task<IActionResult> GetSharedRoute(string shareId)
        {
            Console.WriteLine($"[RoutingController] Megosztott útvonal kérés érkezett: {shareId}");
            
            var routeData = _routeShareService.DecodeShareableId(shareId);
            if (routeData == null)
            {
                Console.WriteLine($"[RoutingController] Érvénytelen vagy lejárt megosztási azonosító");
                return BadRequest("Érvénytelen vagy lejárt útvonal hivatkozás");
            }

            Console.WriteLine($"[RoutingController] Megosztott útvonal dekódolva: FromLat={routeData.FromLat}, FromLon={routeData.FromLon}, ToLat={routeData.ToLat}, ToLon={routeData.ToLon}");

            // Calculate the route using the shared coordinates
            var route = await _routingService.CalculateRouteAsync(routeData.FromLat, routeData.FromLon, routeData.ToLat, routeData.ToLon, null);
            
            if (route == null)
            {
                Console.WriteLine($"[RoutingController] Megosztott útvonal számítás sikertelen");
                return NotFound("Útvonal nem elérhet?");
            }

            // Generate a new shareable link for this route
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            route.ShareableLink = _routeShareService.GenerateShareableLink(routeData.FromLat, routeData.FromLon, routeData.ToLat, routeData.ToLon, baseUrl);

            Console.WriteLine($"[RoutingController] Megosztott útvonal sikeresen kiszámítva");
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