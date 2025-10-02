using DriveWise.Models;

namespace DriveWise.Services
{
    public interface IRouteShareService
    {
        /// <summary>
        /// Generate a shareable link for a route
        /// </summary>
        string GenerateShareableLink(double fromLat, double fromLon, double toLat, double toLon, string baseUrl);
        
        /// <summary>
        /// Decode a shareable route identifier
        /// </summary>
        RouteShareData? DecodeShareableId(string shareId);
        
        /// <summary>
        /// Encrypt route data to create a shareable identifier
        /// </summary>
        string EncryptRouteData(double fromLat, double fromLon, double toLat, double toLon);
        
        /// <summary>
        /// Decrypt a shareable identifier to get route data
        /// </summary>
        RouteShareData? DecryptRouteData(string encryptedData);
    }
    
    public class RouteShareData
    {
        public double FromLat { get; set; }
        public double FromLon { get; set; }
        public double ToLat { get; set; }
        public double ToLon { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}