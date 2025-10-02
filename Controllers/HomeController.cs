using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using DriveWise.Models;
using DriveWise.Services;

namespace DriveWise.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IRouteShareService _routeShareService;

    public HomeController(ILogger<HomeController> logger, IRouteShareService routeShareService)
    {
        _logger = logger;
        _routeShareService = routeShareService;
    }

    public IActionResult Index([FromQuery] string? route = null)
    {
        // Check if there's a shared route parameter
        if (!string.IsNullOrEmpty(route))
        {
            _logger.LogInformation("Megosztott útvonal paraméter észlelve: {Route}", route);
            
            var routeData = _routeShareService.DecodeShareableId(route);
            if (routeData != null)
            {
                _logger.LogInformation("Megosztott útvonal dekódolása sikeres: FromLat={FromLat}, FromLon={FromLon}, ToLat={ToLat}, ToLon={ToLon}", 
                    routeData.FromLat, routeData.FromLon, routeData.ToLat, routeData.ToLon);
                
                // Pass the route data to the view through ViewBag
                ViewBag.SharedRouteData = new {
                    fromLat = routeData.FromLat,
                    fromLon = routeData.FromLon,
                    toLat = routeData.ToLat,
                    toLon = routeData.ToLon,
                    isSharedRoute = true
                };
            }
            else
            {
                _logger.LogWarning("Megosztott útvonal paraméter dekódolása sikertelen: {Route}", route);
                ViewBag.SharedRouteError = "Érvénytelen vagy lejárt útvonal hivatkozás.";
            }
        }
        
        return View();
    }

    // Partial views for ModalManager cards
    public PartialViewResult VehiclesCard()
    {
        return PartialView("_VehiclesCard");
    }

    public PartialViewResult PlanCard()
    {
        return PartialView("_PlanCard");
    }

    public PartialViewResult SettingsCard()
    {
        return PartialView("_SettingsCard");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
