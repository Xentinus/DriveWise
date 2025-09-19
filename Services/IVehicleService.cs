using DriveWise.Models;

namespace DriveWise.Services
{
    public interface IVehicleService
    {
        Vehicle GetDefaultVehicle();
        double CalculateFuelConsumption(double distanceInMeters, Vehicle? vehicle = null, string routeType = "mixed");
    }
}