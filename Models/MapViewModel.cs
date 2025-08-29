public class MapViewModel
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int ZoomLevel { get; set; }

    public MapViewModel()
    {
        Latitude = 47.4979; // Default latitude for Budapest
        Longitude = 19.0402; // Default longitude for Budapest
        ZoomLevel = 13; // Default zoom level
    }
}