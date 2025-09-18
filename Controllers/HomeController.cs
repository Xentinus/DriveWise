using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using DriveWise.Models;

namespace DriveWise.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
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
