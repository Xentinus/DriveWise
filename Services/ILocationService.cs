using DriveWise.Models;

namespace DriveWise.Services
{
    public interface ILocationService
    {
        Task<List<LocationSearchResult>> SearchLocationsAsync(string query, int limit = 5);
        Task<LocationDetails?> GetLocationDetailsAsync(double latitude, double longitude);
    }
}