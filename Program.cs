using System.Net;
using System.Net.Sockets;
using DriveWise.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add HTTP client for weather service
builder.Services.AddHttpClient<IWeatherService, WeatherService>();

// Add HTTP client for location service
builder.Services.AddHttpClient<ILocationService, LocationService>();

// Add HTTP client for routing service
builder.Services.AddHttpClient<IRoutingService, RoutingService>();

// Register weather service
builder.Services.AddScoped<IWeatherService, WeatherService>();

// Register location service
builder.Services.AddScoped<ILocationService, LocationService>();

// Register routing service
builder.Services.AddScoped<IRoutingService, RoutingService>();

// Check if URLs are already configured via launch settings
var configuredUrls = builder.Configuration["urls"] ?? Environment.GetEnvironmentVariable("ASPNETCORE_URLS");

if (string.IsNullOrEmpty(configuredUrls))
{
    // Configure URLs to use available ports only if not set by launch settings
    var httpPort = GetAvailablePort(5235);
    var httpsPort = GetAvailablePort(7238);
    
    builder.WebHost.UseUrls($"http://0.0.0.0:{httpPort}", $"https://0.0.0.0:{httpsPort}");
    
    Console.WriteLine($"Application will be available at:");
    Console.WriteLine($"HTTP:  http://0.0.0.0:{httpPort}");
    Console.WriteLine($"HTTPS: https://0.0.0.0:{httpsPort}");
    Console.WriteLine($"From other devices use your IP address (e.g., http://10.0.0.12:{httpPort})");
}
else
{
    // Parse configured URLs and check if ports are available
    var urls = configuredUrls.Split(';');
    var availableUrls = new List<string>();
    
    foreach (var url in urls)
    {
        var uri = new Uri(url.Trim());
        var port = uri.Port;
        
        if (IsPortAvailable(port))
        {
            availableUrls.Add(url.Trim());
        }
        else
        {
            // Find alternative port
            var newPort = GetAvailablePort(port);
            var newUrl = $"{uri.Scheme}://{uri.Host}:{newPort}";
            availableUrls.Add(newUrl);
            Console.WriteLine($"Port {port} is busy, using {newPort} instead");
        }
    }
    
    var finalUrls = string.Join(";", availableUrls);
    builder.WebHost.UseUrls(finalUrls.Split(';'));
    Console.WriteLine($"Using URLs: {finalUrls}");
}

var app = builder.Build();

// Selective cache control middleware
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";
    
    // Check if this is a static file that Service Worker might want to cache
    var isStaticFile = path.EndsWith(".css") || path.EndsWith(".js") || 
                      path.EndsWith(".png") || path.EndsWith(".jpg") || 
                      path.EndsWith(".svg") || path.EndsWith(".ico") ||
                      path.EndsWith(".json") || path.Contains("/icons/");
    
    var isServiceWorker = path.EndsWith("sw.js");
    var isManifest = path.EndsWith("manifest.json");
    var isOfflinePage = path.EndsWith("offline.html");
    
    if (isServiceWorker || isManifest || isOfflinePage)
    {
        // Allow these to be cached by Service Worker but force revalidation
        context.Response.Headers.Append("Cache-Control", "public, max-age=0, must-revalidate");
    }
    else if (isStaticFile)
    {
        // For static files, use moderate cache prevention that doesn't break Service Worker
        context.Response.Headers.Append("Cache-Control", "no-cache, must-revalidate");
        context.Response.Headers.Append("Pragma", "no-cache");
        context.Response.Headers.Append("Expires", "0");
    }
    else
    {
        // For HTML pages and API endpoints, use aggressive cache prevention
        context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, private");
        context.Response.Headers.Append("Pragma", "no-cache");
        context.Response.Headers.Append("Expires", "Thu, 01 Jan 1970 00:00:00 GMT");
        context.Response.Headers.Append("Last-Modified", DateTime.UtcNow.ToString("R"));
        context.Response.Headers.Append("Etag", Guid.NewGuid().ToString());
        context.Response.Headers.Append("Surrogate-Control", "no-store");
        // Only add Vary header to non-static content to avoid Service Worker issues
        context.Response.Headers.Append("Vary", "Accept-Encoding");
    }
    
    // Set timestamp parameter for cache busting on dynamic content only
    if (!context.Request.Query.ContainsKey("v") && !isStaticFile)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        context.Request.QueryString = context.Request.QueryString.Add("v", timestamp);
    }
    
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();

static int GetAvailablePort(int preferredPort)
{
    try
    {
        // Try the preferred port first
        using var listener = new TcpListener(IPAddress.Any, preferredPort);
        listener.Start();
        listener.Stop();
        return preferredPort;
    }
    catch
    {
        // If preferred port is not available, get a random available port
        using var listener = new TcpListener(IPAddress.Any, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}

static bool IsPortAvailable(int port)
{
    try
    {
        using var listener = new TcpListener(IPAddress.Any, port);
        listener.Start();
        listener.Stop();
        return true;
    }
    catch
    {
        return false;
    }
}
