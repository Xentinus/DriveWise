using System.Net;
using System.Net.Sockets;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

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
