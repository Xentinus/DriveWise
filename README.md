# DriveWise

![DriveWise Logo](.github/logo.png)

**DriveWise** - Intelligent route planning application with fuel cost optimization, real-time weather data, and advanced vehicle management.

> **Note:** This project was created for testing purposes and is not under active development. The application features a Hungarian user interface and integrates Hungarian fuel price data, designed specifically for the Hungarian market.

## 🚗 Features

- **🗺️ Intelligent Route Planning** - Calculate optimal routes with real-time traffic data
- **⛽ Fuel Cost Calculator** - Real-time fuel prices and consumption calculations
- **🌤️ Weather Integration** - Current weather conditions along the route
- **🚙 Vehicle Management** - Manage multiple vehicle profiles with custom consumption data
- **📱 Progressive Web App (PWA)** - Mobile-friendly interface with offline support
- **🎨 Dark/Light Theme** - Automatic and manual theme switching
- **📍 GPS-based Location** - Automatic starting point detection

## 📸 Screenshots

### Route Planning
![Route Planning](.github/route.jpeg)
*Plan routes between two points with detailed information including elevation difference, travel cost, fuel calculation, and more. The example shows a 190km route with 2h 46min travel time, 11.6L fuel consumption, and total cost of 6817 Ft.*

### Vehicle Management
![Vehicle Management](.github/edit.jpeg)
*Manage your vehicles with custom settings including brand, model, fuel type, and consumption rates (e.g., 7.5 L/100km).*

### Location Information
![Location Information](.github/tag.jpeg)
*Tap any location to view detailed information including address, coordinates, and elevation. You can also navigate to that point from your current GPS location.*

## 🛠️ Technology Stack

- **Backend**: ASP.NET Core 9.0 (C#)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs**: OpenWeatherMap, OSRM (route planning), holtankoljak.hu (fuel prices)
- **Containerization**: Docker & Docker Compose
- **Platforms**: Windows, macOS, Linux, Raspberry Pi (ARM64)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xentinus/DriveWise.git
   cd DriveWise
   ```

2. **Run the application**
   ```bash
   ./run-docker.sh
   ```

3. **Open in browser**
   ```
   http://localhost:8800
   ```

### Development Environment

1. **Prerequisites**
   - .NET 9.0 SDK
   - OpenWeatherMap API key (optional, not required for demo mode)

2. **Run the project**
   ```bash
   dotnet restore
   dotnet run
   ```

## ⚙️ Configuration

### Weather API Setup

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Copy `appsettings.Example.json` to `appsettings.json`
3. Update the API key:

```json
{
  "OpenWeatherMap": {
    "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

**Note**: Without an API key, the application will use mock data.

## 🐳 Docker Deployment Options

### Simple Run
```bash
# Start application
./run-docker.sh

# Stop application
./stop-docker.sh
```

### Docker Compose
```bash
# Run in background
docker-compose up -d --build

# Stop
docker-compose down
```

### Multi-platform Build
```bash
# Build for AMD64 + ARM64 simultaneously
./build-multiarch.sh
```

## 🍓 Raspberry Pi Deployment

DriveWise natively supports the Raspberry Pi platform.

### Prerequisites

#### Raspberry Pi Requirements:
- **Raspberry Pi 4 or newer** (min. 2GB RAM recommended)
- **Raspberry Pi OS 64-bit** installed
- **Docker installed** on the Raspberry Pi

#### Installing Docker on Raspberry Pi:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Reboot required for group changes
sudo reboot
```

### Installing DriveWise on Raspberry Pi

#### Method 1: Transfer ARM64 Image File

1. **Create ARM64 image** (on development machine):
   ```bash
   ./build-multiarch.sh
   ```

2. **Transfer file** to Raspberry Pi:
   ```bash
   # On development machine
   scp drivewise-arm64-*.tar pi@your-pi-ip:~/
   ```

3. **Load image** on Raspberry Pi:
   ```bash
   # On the Raspberry Pi
   docker load < drivewise-arm64-*.tar
   ```

4. **Transfer docker-compose file**:
   ```bash
   # On development machine
   scp docker-compose.rpi.yml pi@your-pi-ip:~/docker-compose.yml
   ```

5. **Start application** on Raspberry Pi:
   ```bash
   # On the Raspberry Pi
   docker-compose up -d
   ```

#### Method 2: Using Registry (if available)

If you've uploaded to a registry using the `build-registry.sh` script:

```bash
# On the Raspberry Pi
docker pull yourusername/drivewise:latest
docker run -p 8800:8800 --name drivewise-rpi -d yourusername/drivewise:latest
```

### Access

The application will be available at the Raspberry Pi's IP address:
- **http://[raspberry-pi-ip]:8800**

For example: `http://192.168.1.100:8800`

### Useful Commands on Raspberry Pi

```bash
# Check container status
docker ps

# View logs
docker logs drivewise-rpi

# Restart container
docker restart drivewise-rpi

# Stop container
docker stop drivewise-rpi

# Check system resources
htop
free -h
df -h

# Check network
ip addr show
```

### Performance Optimization

#### Raspberry Pi 4 (4GB+ RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

#### Raspberry Pi 4 (2GB RAM):
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Raspberry Pi Troubleshooting

#### Memory Issues:
```bash
# Increase swap file
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Network Issues:
```bash
# Check firewall
sudo ufw status
sudo ufw allow 8800

# Check port
sudo netstat -tulpn | grep 8800
```

#### Docker Issues:
```bash
# Restart Docker service
sudo systemctl restart docker

# Reduce Docker log level
sudo nano /etc/docker/daemon.json
# {"log-level": "warn"}
sudo systemctl restart docker
```

### Auto-start

The `restart: unless-stopped` setting ensures the application automatically starts when the Raspberry Pi reboots.

### Security Recommendations

1. **Change the default password** on the Raspberry Pi
2. **Enable SSH key authentication**
3. **Configure firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 8800
   ```
4. **Regular updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 🌐 API Endpoints

### Route Planning
```http
POST /api/routing/route
Content-Type: application/json

{
  "fromLat": 47.4979,
  "fromLon": 19.0402,
  "toLat": 47.5,
  "toLon": 19.05,
  "vehicle": {
    "name": "Car",
    "fuelType": "benzin",
    "consumption": 7.0
  }
}
```

### Fuel Prices
```http
GET /api/fuelprice
GET /api/fuelprice/benzin
POST /api/fuelprice/calculate-cost
```

### Weather
```http
GET /api/weather?lat=47.4979&lon=19.0402
```

### Location Search
```http
GET /api/location/search?query=Budapest
GET /api/location/details?lat=47.4979&lon=19.0402
```

## 📁 Project Structure

```
DriveWise/
├── Controllers/          # API controllers
│   ├── FuelPriceController.cs
│   ├── RoutingController.cs
│   ├── WeatherController.cs
│   └── LocationController.cs
├── Services/            # Business logic services
│   ├── FuelPriceService.cs
│   ├── RoutingService.cs
│   ├── WeatherService.cs
│   └── VehicleService.cs
├── Models/              # Data models
│   ├── Vehicle.cs
│   ├── WeatherData.cs
│   └── LocationModels.cs
├── BackgroundServices/  # Background services
│   └── FuelPriceBackgroundService.cs
├── Views/               # Frontend views
│   └── Home/
├── wwwroot/            # Static files
│   ├── css/
│   ├── js/
│   └── manifest.json
└── Docker/             # Containerization files
```

## 🔧 Developer Commands

```bash
# Build project
dotnet build

# Run tests
dotnet test

# Publish
dotnet publish

# Watch mode (automatic restart)
dotnet watch run
```

### VS Code Tasks
```bash
# Run build task
Ctrl+Shift+P → "Tasks: Run Task" → "build"

# Start watch mode
Ctrl+Shift+P → "Tasks: Run Task" → "watch"
```

## 🌍 Network Requirements

### External API Dependencies

DriveWise uses several external web services, so an internet connection and access to certain ports are required.

#### Required Outgoing Connections

**HTTP/HTTPS Ports**
- **Port 80** (HTTP) - Basic web API calls
- **Port 443** (HTTPS) - Encrypted API calls
- **Port 8800** - Application access (configurable)

#### External Services Used

1. **Fuel Prices** - `holtankoljak.hu`
   - Protocol: HTTPS (443)
   - Update Frequency: Automatic background service
   - Purpose: Fetching current fuel prices

2. **Weather API** - `api.openweathermap.org`
   - Protocol: HTTPS (443)
   - Usage: Weather data during route planning
   - Type: REST API

3. **Location Services**
   - Protocol: HTTPS (443)
   - Usage: Geocoding addresses, location search
   - Type: RESTful API

4. **Route Planning API** - `router.project-osrm.org`
   - Protocol: HTTPS (443)
   - Usage: Calculating optimal routes
   - Type: Routing API

### Docker Network Configuration

#### Default Settings
Docker containers have internet access by default, but we explicitly ensure:

```yaml
# docker-compose.yml
services:
  drivewise:
    network_mode: "bridge"  # Default bridge network
```

#### Docker Run Command
```bash
docker run -d -p 8800:8800 --network bridge --name drivewise-app drivewise
```

### Firewall Settings

#### Linux/Raspberry Pi
```bash
# UFW firewall configuration
sudo ufw allow out 80/tcp
sudo ufw allow out 443/tcp
sudo ufw allow in 8800/tcp

# Or iptables
sudo iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8800 -j ACCEPT
```

#### Windows/macOS
Docker Desktop automatically manages outgoing connections.

### Network Diagnostics

#### Testing Container Network
```bash
# Enter container
docker exec -it drivewise-app /bin/bash

# Test DNS resolution
nslookup holtankoljak.hu

# Test HTTP connection
curl -I https://holtankoljak.hu

# Network interfaces
ip addr show

# Check routes
ip route
```

#### Check Application Logs
```bash
# Monitor HTTP calls
docker logs -f drivewise-app | grep -i "http"

# Search for API calls
docker logs drivewise-app | grep -E "(holtankoljak|weather|routing)"
```

### Network Troubleshooting

#### Common Issues

1. **API calls failing**
   ```bash
   # Check DNS
   docker exec drivewise-app nslookup google.com

   # Check outgoing connections
   docker exec drivewise-app curl -I https://httpbin.org/get
   ```

2. **In proxy environment**
   ```yaml
   # docker-compose.yml
   environment:
     - HTTP_PROXY=http://proxy:8080
     - HTTPS_PROXY=http://proxy:8080
     - NO_PROXY=localhost,127.0.0.1
   ```

3. **Corporate firewall**
   - Enable outgoing HTTPS traffic
   - Whitelist used domains
   - Handle certificates for SSL-bumping

#### Log Levels
```bash
# Enable detailed HTTP logs
docker run -e Logging__LogLevel__Default=Debug drivewise
```

### Security Considerations

1. **Minimal privileges**
   - Only open necessary ports
   - Run container as non-root user

2. **Network segmentation**
   - Use separate Docker network
   - Isolate database and cache

3. **Monitoring**
   - Monitor outgoing connections
   - Detect abnormal traffic

### Raspberry Pi Network Specific

#### Limited Resources
```yaml
# docker-compose.rpi.yml
services:
  drivewise:
    sysctls:
      - net.core.somaxconn=1024
    ulimits:
      nofile: 65536
```

#### Network Optimization
```bash
# On Raspberry Pi
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
sudo sysctl -p
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change port in docker-compose.yml
ports:
  - "8801:8800"  # Use 8801 instead of 8800
```

**API Errors**
```bash
# View application logs
docker logs -f drivewise-app

# Or with docker-compose
docker-compose logs -f
```

**Fuel price API unavailable**
- Application automatically uses fallback data
- Background service retries every 30 minutes

### Debug Modes

```bash
# Fuel price test
curl http://localhost:8800/api/debug/test-fuel

# Route test
curl http://localhost:8800/api/debug/test-route

# Frontend simulation
curl http://localhost:8800/api/debug/simulate-frontend-data
```

## 📱 PWA Features

- **Offline functionality**: Service Worker caching
- **Installable**: "Add to Home Screen" support
- **Responsive**: Mobile-first design
- **App-like experience**: Native application feel

## 🎨 Customization

### Themes
- Automatic dark/light mode
- System theme following
- Manual theme switching option

### Vehicles
- Custom consumption profiles
- Different fuel types
- City/highway/mixed route calculations

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🔧 DriveWise Unified Management Script

### Overview

The DriveWise project can be managed with a unified `drivewise.sh` script that contains all Docker and deployment operations in one place with an interactive menu.

### 🚀 Quick Start

#### 1. Environment Setup

First, copy the `.env.example` file to `.env` and fill in your data:

```bash
cp .env.example .env
nano .env  # or any text editor
```

In the `.env` file, configure:
- `RPI_HOST`: Raspberry Pi IP address
- `RPI_USER`: Raspberry Pi username
- `RPI_PASSWORD`: Raspberry Pi password
- `IMAGE_NAME`: Docker image name (default: drivewise)
- `CONTAINER_NAME`: Docker container name
- `CONTAINER_PORT`: Application port (default: 8800)
- `REGISTRY`: Docker registry (optional)

#### 2. Run Script

```bash
./drivewise.sh
```

### 📋 Available Functions

The interactive menu has 10 options:

#### 1. 🏗️ Build local (AMD64)
Build local AMD64 Docker image for desktop use (macOS Intel/AMD, Linux x86).

```bash
# Automatic build
./drivewise.sh
# Choose: 1
```

#### 2. 🚀 Run local
Start local Docker container. If no image exists, it builds automatically.
- Port: `http://localhost:8800` (or configured port)
- Automatically stops and restarts if already running

```bash
# Quick start
./drivewise.sh
# Choose: 2
```

#### 3. 🛑 Stop local
Stop and remove local container.

#### 4. 📦 Build multi-arch
Multi-architecture build (AMD64 + ARM64):
- **AMD64**: Loads locally for use
- **ARM64**: Exports to `.tar` file for copying to Raspberry Pi

```bash
# Multi-platform build
./drivewise.sh
# Choose: 4
```

#### 5. 🌐 Build & push to registry
Build and push to Docker registry (Docker Hub, GitHub Container Registry, etc.)
- Multi-architecture support
- Automatic version tagging

#### 6. 🍓 Deploy to Raspberry Pi
**Fully automated Raspberry Pi deployment:**

1. Build ARM64 image
2. Test SSH connection
3. Upload image to Pi
4. Remove old containers and images
5. Start new container
6. Health check and log verification

**During deployment:**
- Automatically installs `sshpass` if missing (via Homebrew)
- Runs network tests
- HTTP endpoint verification
- Detailed error messages

```bash
# Single command for entire deployment!
./drivewise.sh
# Choose: 6
```

#### 7. 📋 View logs
View logs:
- Local container
- Raspberry Pi container

#### 8. 🔍 Check status
Status check:
- Local container status
- Raspberry Pi container status

#### 9. 🧹 Clean up
Cleanup options:
- Local only
- Raspberry Pi only
- Both
- Deep clean (including images)

#### 0. ❌ Exit
Exit script.

### 🔧 Prerequisites

#### Local Machine (macOS/Linux)

```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# Homebrew (macOS) - for sshpass installation
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# sshpass - installs automatically, but can also install manually:
brew install hudochenkov/sshpass/sshpass
```

#### Raspberry Pi

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 📝 Usage Examples

#### First Time - Full Setup

```bash
# 1. Create .env file
cp .env.example .env
nano .env

# 2. Run script
./drivewise.sh

# 3. Choose option "6" (Deploy to Raspberry Pi)
# The script does everything automatically!
```

#### Local Development

```bash
./drivewise.sh

# Choose:
# 1 - Build local
# 2 - Run local
# 7 - View logs
```

#### Update on Raspberry Pi

```bash
./drivewise.sh

# Choose:
# 6 - Deploy to Raspberry Pi
# New version automatically builds and deploys
```

### 🔐 Security

- The `.env` file is **NOT** committed to git
- Only `.env.example` is version controlled
- Never share the `.env` file or commit it to git!

### 🐛 Troubleshooting

#### SSH Connection Error

```bash
# Test manually:
ssh user@raspberry-pi-ip

# Check:
# - Correct IP address
# - SSH running on Pi
# - Correct username/password
```

#### Docker Not Running

```bash
# Check if Docker Desktop is running
docker info

# If not, start Docker Desktop application
```

#### Port Already in Use

```bash
# Check what's using the port:
lsof -i :8800

# Stop conflicting service or change port in .env
```

#### ARM64 Build Error

```bash
# Recreate buildx builder:
docker buildx rm drivewise-multiarch
docker buildx create --name drivewise-multiarch --platform linux/amd64,linux/arm64 --use
```

### 📚 Additional Information

#### Useful Docker Commands

```bash
# Container logs
docker logs -f drivewise-app

# Container shell
docker exec -it drivewise-app /bin/bash

# Image list
docker images | grep drivewise

# Restart container
docker restart drivewise-app
```

#### Raspberry Pi Remote Commands

```bash
# SSH connection with .env data
ssh user@raspberry-pi-ip

# Docker status on Pi
ssh user@raspberry-pi-ip 'docker ps'

# Logs from Pi
ssh user@raspberry-pi-ip 'docker logs drivewise-app'
```

### 🎯 Tips

1. **First run**: Always start with option "1" or "6" (build or deploy)
2. **During development**: Use local build and run options (1-2)
3. **Production environment**: Deploy to Pi (6) automatically handles everything
4. **Logs**: Use option "7" to diagnose problems
5. **Cleanup**: Option "9" frees up space

### 🔄 Migration from Old Scripts

If you previously used individual scripts (`run-docker.sh`, `deploy-to-rpi.sh`, etc.), they're now all in one:

| Old Script | New Menu Option |
|-------------|-------------|
| `run-docker.sh` | 1 (Build local) + 2 (Run local) |
| `stop-docker.sh` | 3 (Stop local) |
| `build-multiarch.sh` | 4 (Build multi-arch) |
| `build-registry.sh` | 5 (Build & push to registry) |
| `deploy-to-rpi.sh` | 6 (Deploy to Raspberry Pi) |
| *new* | 7 (View logs) |
| *new* | 8 (Check status) |
| *new* | 9 (Clean up) |

### ✨ New Features Compared to Old Scripts

1. ✅ **Interactive menu** - easy navigation
2. ✅ **Colored output** - easier readability
3. ✅ **Unified configuration** - everything in one `.env` file
4. ✅ **Log viewer** - local and remote logs
5. ✅ **Status checker** - quick status check
6. ✅ **Cleanup options** - flexible cleanup
7. ✅ **Error handling** - detailed error messages
8. ✅ **Automatic prerequisite check** - Docker, sshpass, etc.
9. ✅ **Security** - no passwords in git

---

**DriveWise** - *Smart travel, optimal costs.* 🚗✨
