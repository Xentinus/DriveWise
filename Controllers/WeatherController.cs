using Microsoft.AspNetCore.Mvc;
using DriveWise.Services;

namespace DriveWise.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly IWeatherService _weatherService;

        public WeatherController(IWeatherService weatherService)
        {
            _weatherService = weatherService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWeather([FromQuery] double lat, [FromQuery] double lon)
        {
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
            {
                return BadRequest("Invalid coordinates");
            }

            var weatherData = await _weatherService.GetWeatherByCoordinatesAsync(lat, lon);
            
            if (weatherData == null)
            {
                return NotFound("Weather data not available");
            }

            return Ok(weatherData);
        }
    }
}