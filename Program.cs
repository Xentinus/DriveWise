using System.Net;
using System.Net.Sockets;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Configure URLs to use available ports
var httpPort = GetAvailablePort(5235);
var httpsPort = GetAvailablePort(7238);

builder.WebHost.UseUrls($"http://0.0.0.0:{httpPort}", $"https://0.0.0.0:{httpsPort}");

var app = builder.Build();

Console.WriteLine($"Application will be available at:");
Console.WriteLine($"HTTP:  http://0.0.0.0:{httpPort}");
Console.WriteLine($"HTTPS: https://0.0.0.0:{httpsPort}");
Console.WriteLine($"From other devices use your IP address (e.g., http://10.0.0.12:{httpPort})");

// Configure the HTTP request pipeline.
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
