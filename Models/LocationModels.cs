namespace DriveWise.Models
{
    public class LocationSearchResult
    {
        public string DisplayName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public LocationAddress? Address { get; set; }
    }

    public class LocationDetails
    {
        public string DisplayName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public LocationAddress? Address { get; set; }
        public double? Elevation { get; set; }
    }

    public class LocationAddress
    {
        public string HouseNumber { get; set; } = string.Empty;
        public string Road { get; set; } = string.Empty;
        public string Neighbourhood { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }
}