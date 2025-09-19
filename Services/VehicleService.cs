using DriveWise.Models;

namespace DriveWise.Services
{
    public class VehicleService : IVehicleService
    {
        public Vehicle GetDefaultVehicle()
        {
            return new Vehicle
            {
                Id = "default",
                Name = "Alapértelmezett jármű",
                Type = "default",
                Brand = "",
                Model = "",
                FuelType = "petrol",
                Consumption = 7.0, // 7 L/100km default
                Year = DateTime.Now.Year,
                IsDefault = true
            };
        }

        public double CalculateFuelConsumption(double distanceInMeters, Vehicle? vehicle = null, string routeType = "mixed")
        {
            // Use provided vehicle or default
            var effectiveVehicle = vehicle ?? GetDefaultVehicle();
            
            // Calculate fuel consumption using the vehicle's method
            return effectiveVehicle.CalculateFuelConsumption(distanceInMeters, routeType);
        }
    }
}