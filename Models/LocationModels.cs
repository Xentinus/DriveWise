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

    // Route models
    public class RouteResult
    {
        public RouteGeometry? Geometry { get; set; }
        public double Distance { get; set; } // in meters
        public double Duration { get; set; } // in seconds
        public List<RouteStep> Steps { get; set; } = new List<RouteStep>();
    }

    public class RouteGeometry
    {
        public string Type { get; set; } = "LineString";
        public List<List<double>> Coordinates { get; set; } = new List<List<double>>();
    }

    public class RouteStep
    {
        public string Instruction { get; set; } = string.Empty;
        public double Distance { get; set; }
        public double Duration { get; set; }
        public RouteGeometry? Geometry { get; set; }
    }
}