# DriveWise Installation Guide

This guide covers all installation methods for DriveWise, including Docker, local development, and Raspberry Pi deployment.

## Table of Contents

- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [Raspberry Pi Deployment](#raspberry-pi-deployment)
- [Configuration](#configuration)
- [Network Requirements](#network-requirements)
- [Troubleshooting](#troubleshooting)

---

## Quick Start with Docker

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xentinus/DriveWise.git
   cd DriveWise
   ```

2. **Run the application**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   ```
   http://localhost:8800
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

### Using Docker Run

```bash
# Build the image
docker build -t drivewise .

# Run the container
docker run -d -p 8800:8800 --name drivewise-app drivewise

# Stop the container
docker stop drivewise-app
docker rm drivewise-app
```

### Using Management Script

For a simplified experience with interactive menu:

```bash
./drivewise.sh
```

See [MANAGEMENT_SCRIPT.md](MANAGEMENT_SCRIPT.md) for detailed documentation.

---

## Local Development Setup

### Prerequisites

- .NET 9.0 SDK
- OpenWeatherMap API key (optional, not required for demo mode)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xentinus/DriveWise.git
   cd DriveWise
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Configure API keys (optional)**

   Copy the example configuration:
   ```bash
   cp appsettings.Example.json appsettings.json
   ```

   Edit `appsettings.json` and add your API keys:
   ```json
   {
     "OpenWeatherMap": {
       "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
     }
   }
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

5. **Access the application**
   ```
   http://localhost:5235
   ```

### Development Commands

```bash
# Build project
dotnet build

# Run tests
dotnet test

# Publish
dotnet publish

# Watch mode (automatic restart on file changes)
dotnet watch run
```

### VS Code Tasks

```bash
# Run build task
Ctrl+Shift+P → "Tasks: Run Task" → "build"

# Start watch mode
Ctrl+Shift+P → "Tasks: Run Task" → "watch"
```

---

## Raspberry Pi Deployment

DriveWise natively supports the Raspberry Pi platform with ARM64 architecture.

### Prerequisites

#### Raspberry Pi Requirements
- **Raspberry Pi 4 or newer** (min. 2GB RAM recommended)
- **Raspberry Pi OS 64-bit** installed
- **Docker installed** on the Raspberry Pi

#### Installing Docker on Raspberry Pi

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

### Deployment Methods

#### Method 1: Automated Deployment with Management Script

The easiest way to deploy to Raspberry Pi:

1. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Set your Raspberry Pi details:
   ```bash
   RPI_HOST=192.168.1.100
   RPI_USER=pi
   RPI_PASSWORD=your_password
   ```

2. **Run deployment**
   ```bash
   ./drivewise.sh
   # Choose option 6: Deploy to Raspberry Pi
   ```

The script will automatically:
- Build ARM64 image
- Test SSH connection
- Upload image to Pi
- Remove old containers and images
- Start new container
- Verify deployment with health checks

#### Method 2: Manual ARM64 Image Transfer

1. **Build ARM64 image** (on development machine):
   ```bash
   docker buildx create --name multiarch --use
   docker buildx build --platform linux/arm64 -t drivewise:arm64 --output type=docker,dest=drivewise-arm64.tar .
   ```

2. **Transfer to Raspberry Pi**:
   ```bash
   scp drivewise-arm64.tar pi@raspberry-pi-ip:~/
   ```

3. **Load and run on Raspberry Pi**:
   ```bash
   # On the Raspberry Pi
   docker load < drivewise-arm64.tar
   docker run -d -p 8800:8800 --restart unless-stopped --name drivewise-rpi drivewise:arm64
   ```

#### Method 3: Using Docker Registry

If you have a Docker registry (Docker Hub, GitHub Container Registry):

```bash
# On development machine
docker buildx build --platform linux/amd64,linux/arm64 -t yourusername/drivewise:latest --push .

# On Raspberry Pi
docker pull yourusername/drivewise:latest
docker run -d -p 8800:8800 --restart unless-stopped --name drivewise-rpi yourusername/drivewise:latest
```

### Accessing the Application

The application will be available at:
```
http://[raspberry-pi-ip]:8800
```

For example: `http://192.168.1.100:8800`

### Useful Raspberry Pi Commands

```bash
# Check container status
docker ps

# View logs
docker logs drivewise-rpi
docker logs -f drivewise-rpi  # Follow logs

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

#### For Raspberry Pi 4 (4GB+ RAM)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  drivewise:
    image: drivewise:arm64
    ports:
      - "8800:8800"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### For Raspberry Pi 4 (2GB RAM)

```yaml
version: '3.8'
services:
  drivewise:
    image: drivewise:arm64
    ports:
      - "8800:8800"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Auto-start Configuration

The `restart: unless-stopped` policy ensures the application automatically starts when the Raspberry Pi reboots.

### Raspberry Pi Security Recommendations

1. **Change default password**
   ```bash
   passwd
   ```

2. **Enable SSH key authentication**
   ```bash
   ssh-copy-id pi@raspberry-pi-ip
   ```

3. **Configure firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 8800
   ```

4. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Configuration

### Environment Variables

Create a `.env` file for Docker deployment:

```bash
# Application Settings
CONTAINER_PORT=8800
IMAGE_NAME=drivewise
CONTAINER_NAME=drivewise-app

# Raspberry Pi Settings (for deployment script)
RPI_HOST=192.168.1.100
RPI_USER=pi
RPI_PASSWORD=your_password

# Docker Registry (optional)
REGISTRY=docker.io/yourusername
```

### Application Settings

Edit `appsettings.json`:

```json
{
  "OpenWeatherMap": {
    "ApiKey": "your_api_key_here"
  },
  "RouteShare": {
    "EncryptionKey": "your_32_character_encryption_key"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**Notes:**
- OpenWeatherMap API key is optional; the app uses fallback data without it
- RouteShare encryption key has a default value; custom key is optional
- Without API key, weather features will use mock data

### Port Configuration

If port 8800 is already in use, change it in:

**Docker Compose:**
```yaml
ports:
  - "8801:8800"  # External:Internal
```

**Docker Run:**
```bash
docker run -d -p 8801:8800 --name drivewise-app drivewise
```

---

## Network Requirements

### External API Dependencies

DriveWise requires internet connectivity to access external services:

#### Required Services

1. **Fuel Prices** - `holtankoljak.hu`
   - Protocol: HTTPS (port 443)
   - Update Frequency: Every 24 hours (automatic)
   - Purpose: Hungarian fuel price data

2. **Weather API** - `api.openweathermap.org`
   - Protocol: HTTPS (port 443)
   - Usage: Weather data for routes
   - Type: REST API

3. **Location Services** - Nominatim/OpenStreetMap
   - Protocol: HTTPS (port 443)
   - Usage: Geocoding and location search
   - Type: RESTful API

4. **Route Planning** - `router.project-osrm.org`
   - Protocol: HTTPS (port 443)
   - Usage: Route calculations
   - Type: Routing API

### Required Ports

**Inbound:**
- Port 8800 (or configured port) - Application access

**Outbound:**
- Port 80 (HTTP) - Basic web requests
- Port 443 (HTTPS) - Encrypted API calls

### Firewall Configuration

#### Linux/Raspberry Pi

```bash
# UFW
sudo ufw allow in 8800/tcp
sudo ufw allow out 80/tcp
sudo ufw allow out 443/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 8800 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
```

#### Windows/macOS

Docker Desktop automatically manages networking.

### Docker Network Configuration

Default bridge network configuration in `docker-compose.yml`:

```yaml
services:
  drivewise:
    network_mode: "bridge"
```

### Proxy Configuration

If behind a corporate proxy:

```yaml
services:
  drivewise:
    environment:
      - HTTP_PROXY=http://proxy:8080
      - HTTPS_PROXY=http://proxy:8080
      - NO_PROXY=localhost,127.0.0.1
```

### Network Diagnostics

```bash
# Test DNS resolution
docker exec drivewise-app nslookup holtankoljak.hu

# Test HTTP connectivity
docker exec drivewise-app curl -I https://holtankoljak.hu

# Check network interfaces
docker exec drivewise-app ip addr show

# Monitor API calls
docker logs drivewise-app | grep -E "(holtankoljak|weather|routing)"
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem:** Error binding to port 8800

**Solution:**
```bash
# Find what's using the port
lsof -i :8800        # macOS/Linux
netstat -ano | findstr :8800  # Windows

# Either stop the conflicting service or change the port
# In docker-compose.yml:
ports:
  - "8801:8800"
```

#### Docker Not Running

**Problem:** Cannot connect to Docker daemon

**Solution:**
```bash
# Check Docker status
docker info

# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

#### API Connection Failures

**Problem:** Fuel prices or weather not loading

**Solution:**
1. Check internet connectivity
2. Verify firewall allows outbound HTTPS (port 443)
3. Check Docker logs:
   ```bash
   docker logs drivewise-app
   ```
4. The app will use fallback data if APIs are unavailable

#### Memory Issues on Raspberry Pi

**Problem:** Container crashes or freezes

**Solution:**
```bash
# Increase swap file
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set: CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Reduce container memory limit
# In docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 512M
```

#### SSH Connection Issues (Raspberry Pi Deployment)

**Problem:** Cannot connect to Raspberry Pi

**Solution:**
```bash
# Test SSH manually
ssh pi@raspberry-pi-ip

# Check:
# 1. Correct IP address
# 2. SSH service running on Pi:
sudo systemctl status ssh
sudo systemctl start ssh

# 3. Correct username/password in .env file
```

#### Build Errors

**Problem:** Docker build fails

**Solution:**
```bash
# Clean Docker build cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t drivewise .

# For multi-arch builds, recreate builder
docker buildx rm multiarch
docker buildx create --name multiarch --platform linux/amd64,linux/arm64 --use
```

### Debug Mode

Enable detailed logging:

```bash
# Via environment variable
docker run -e Logging__LogLevel__Default=Debug -p 8800:8800 drivewise

# Via docker-compose
environment:
  - Logging__LogLevel__Default=Debug
```

### Debug Endpoints

Test individual components:

```bash
# Test fuel price service
curl http://localhost:8800/api/debug/test-fuel

# Test routing service
curl http://localhost:8800/api/debug/test-route

# Simulate frontend data
curl http://localhost:8800/api/debug/simulate-frontend-data
```

### Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Review [existing issues](https://github.com/Xentinus/DriveWise/issues)
3. Check application logs: `docker logs drivewise-app`
4. Open a new issue with:
   - Detailed description
   - Steps to reproduce
   - Log output
   - Environment details (OS, Docker version, etc.)

---

## Additional Resources

- [Main README](README.md) - Project overview and features
- [Management Script Documentation](MANAGEMENT_SCRIPT.md) - Unified deployment tool
- [API Documentation](https://github.com/Xentinus/DriveWise) - API endpoints reference

---

**DriveWise** - Smart travel, optimal costs. 🚗✨
