using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchLocations([FromQuery] string q, [FromQuery] int limit = 5)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return BadRequest("Query must be at least 2 characters long");
            }

            if (limit < 1 || limit > 20)
            {
                return BadRequest("Limit must be between 1 and 20");
            }

            var results = await _locationService.SearchLocationsAsync(q, limit);
            return Ok(results);
        }

        [HttpGet("details")]
        public async Task<IActionResult> GetLocationDetails([FromQuery] double lat, [FromQuery] double lon)
        {
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
            {
                return BadRequest("Invalid coordinates");
            }

            var details = await _locationService.GetLocationDetailsAsync(lat, lon);
            
            if (details == null)
            {
                return NotFound("Location details not available");
            }

            return Ok(details);
        }
    }
}