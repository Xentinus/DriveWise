namespace DriveWise.Models
{
    public class WeatherData
    {
        public double Temperature { get; set; }
        public string Condition { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public double Humidity { get; set; }
        public double WindSpeed { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }

    public class WeatherApiResponse
    {
        public WeatherMain Main { get; set; } = new();
        public WeatherInfo[] Weather { get; set; } = Array.Empty<WeatherInfo>();
        public WeatherWind Wind { get; set; } = new();
        public string Name { get; set; } = string.Empty;
        public long Dt { get; set; }
    }

    public class WeatherMain
    {
        public double Temp { get; set; }
        public double Humidity { get; set; }
    }

    public class WeatherInfo
    {
        public string Main { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
    }

    public class WeatherWind
    {
        public double Speed { get; set; }
    }
}