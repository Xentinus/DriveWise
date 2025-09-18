using DriveWise.Models;

namespace DriveWise.Services
{
    public interface IRoutingService
    {
        Task<RouteResult?> CalculateRouteAsync(double fromLat, double fromLon, double toLat, double toLon);
    }
}