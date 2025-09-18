using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoutingController : ControllerBase
    {
        private readonly IRoutingService _routingService;

        public RoutingController(IRoutingService routingService)
        {
            _routingService = routingService;
        }

        [HttpGet("route")]
        public async Task<IActionResult> CalculateRoute(
            [FromQuery] double fromLat, 
            [FromQuery] double fromLon, 
            [FromQuery] double toLat, 
            [FromQuery] double toLon)
        {
            if (fromLat < -90 || fromLat > 90 || fromLon < -180 || fromLon > 180 ||
                toLat < -90 || toLat > 90 || toLon < -180 || toLon > 180)
            {
                return BadRequest("Invalid coordinates");
            }

            var route = await _routingService.CalculateRouteAsync(fromLat, fromLon, toLat, toLon);
            
            if (route == null)
            {
                return NotFound("Route not available");
            }

            return Ok(route);
        }
    }
}