# DriveWise Management Script Documentation

The DriveWise project includes a unified `drivewise.sh` management script that simplifies all Docker and deployment operations through an interactive menu interface.

## Overview

The management script provides a single entry point for:
- Building Docker images (local and multi-architecture)
- Running and managing containers
- Deploying to Raspberry Pi
- Viewing logs and checking status
- Cleanup operations

## Quick Start

### 1. Environment Setup

Create a `.env` file with your configuration:

```bash
cp .env.example .env
nano .env  # Edit with your settings
```

### 2. Run the Script

```bash
./drivewise.sh
```

You'll see an interactive menu with 10 options.

## Configuration

### Environment Variables

Edit the `.env` file:

```bash
# Docker Image Settings
IMAGE_NAME=drivewise
CONTAINER_NAME=drivewise-app
CONTAINER_PORT=8800

# Raspberry Pi Deployment Settings
RPI_HOST=192.168.1.100
RPI_USER=pi
RPI_PASSWORD=your_password

# Docker Registry (optional)
REGISTRY=docker.io/yourusername
```

**Security Note:** The `.env` file is excluded from git. Never commit credentials to version control.

## Menu Options

### 1. Build local (AMD64)

Builds a Docker image for local use on AMD64/x86_64 architecture.

**Usage:**
```bash
./drivewise.sh
# Select: 1
```

**What it does:**
- Builds Docker image for AMD64 platform
- Tags as `drivewise:latest`
- Suitable for Intel/AMD processors (macOS, Linux, Windows)

**Requirements:**
- Docker Desktop installed
- Internet connection for downloading base images

---

### 2. Run local

Starts a local Docker container.

**Usage:**
```bash
./drivewise.sh
# Select: 2
```

**What it does:**
- Checks if image exists (builds if needed)
- Stops and removes existing container if running
- Starts new container on configured port
- Application accessible at `http://localhost:8800`

**Automatic behaviors:**
- Builds image if not present
- Replaces running container
- Uses `--restart unless-stopped` policy

---

### 3. Stop local

Stops and removes the local container.

**Usage:**
```bash
./drivewise.sh
# Select: 3
```

**What it does:**
- Stops running container
- Removes container (keeps image)
- Frees up the port

---

### 4. Build multi-arch

Builds Docker images for multiple architectures.

**Usage:**
```bash
./drivewise.sh
# Select: 4
```

**What it does:**
- Creates buildx builder if needed
- Builds for AMD64 and ARM64 platforms
- AMD64: Loads to local Docker
- ARM64: Exports to `.tar` file for transfer

**Output:**
- `drivewise-arm64-[timestamp].tar` - Ready for Raspberry Pi

**Use case:**
- Preparing ARM64 image for Raspberry Pi deployment
- Creating multi-platform images

---

### 5. Build & push to registry

Builds and pushes multi-architecture images to a Docker registry.

**Usage:**
```bash
./drivewise.sh
# Select: 5
```

**Prerequisites:**
- Docker registry configured in `.env`
- Docker login completed: `docker login`

**What it does:**
- Builds for AMD64 and ARM64
- Tags with registry name
- Pushes both architectures
- Makes image publicly/privately available

**Example registry configurations:**
```bash
# Docker Hub
REGISTRY=docker.io/yourusername

# GitHub Container Registry
REGISTRY=ghcr.io/yourusername

# Private registry
REGISTRY=registry.company.com/project
```

---

### 6. Deploy to Raspberry Pi

Fully automated deployment to Raspberry Pi.

**Usage:**
```bash
./drivewise.sh
# Select: 6
```

**Prerequisites:**
- Raspberry Pi with Docker installed
- SSH access configured
- RPI settings in `.env` file
- `sshpass` installed (script installs automatically on macOS)

**Deployment steps:**
1. Tests SSH connectivity
2. Builds ARM64 image
3. Transfers image to Pi via SSH
4. Loads image on Pi
5. Stops and removes old container
6. Starts new container
7. Runs health checks
8. Displays logs

**What it verifies:**
- SSH connection successful
- Image transferred correctly
- Container started
- Application responding on HTTP
- No errors in logs

**Automatic features:**
- Installs `sshpass` if missing (macOS via Homebrew)
- Cleans up old images and containers on Pi
- Configures auto-restart policy
- Validates deployment with health checks

---

### 7. View logs

View container logs from local or remote containers.

**Usage:**
```bash
./drivewise.sh
# Select: 7
```

**Options:**
- View local container logs
- View Raspberry Pi container logs (via SSH)

**Features:**
- Follows log output (like `tail -f`)
- Press `Ctrl+C` to exit
- Useful for troubleshooting

---

### 8. Check status

Check container status locally and remotely.

**Usage:**
```bash
./drivewise.sh
# Select: 8
```

**Information displayed:**
- Container running state
- Container ID
- Uptime
- Port mappings
- Resource usage

**Checks:**
- Local Docker container
- Raspberry Pi container (via SSH)

---

### 9. Clean up

Remove containers and optionally images.

**Usage:**
```bash
./drivewise.sh
# Select: 9
```

**Options:**
1. Clean local only
2. Clean Raspberry Pi only
3. Clean both
4. Deep clean (includes images)

**What it cleans:**
- Stopped containers
- Unused images (if deep clean selected)
- Exported `.tar` files
- Build cache (if selected)

**Safety:**
- Prompts for confirmation
- Shows what will be deleted
- Option to cancel

---

### 0. Exit

Exits the management script.

## Prerequisites

### Local Machine (macOS/Linux)

1. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Required for all local operations

2. **Homebrew** (macOS only, for automatic sshpass installation)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **sshpass** (for Raspberry Pi deployment)
   - macOS: Installed automatically by script via Homebrew
   - Linux: `sudo apt install sshpass` or `sudo yum install sshpass`

### Raspberry Pi

1. **Docker installed**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **SSH enabled**
   ```bash
   sudo systemctl enable ssh
   sudo systemctl start ssh
   ```

3. **Network accessible**
   - Know the IP address: `hostname -I`
   - Firewall allows SSH (port 22) and app port (8800)

## Usage Examples

### First Time Setup

```bash
# 1. Setup environment
cp .env.example .env
nano .env  # Configure your settings

# 2. Deploy to Raspberry Pi
./drivewise.sh
# Choose: 6 (Deploy to Raspberry Pi)

# Everything is automated!
```

### Local Development Workflow

```bash
# Start development
./drivewise.sh
# Choose: 2 (Run local)

# Make code changes...

# Rebuild and restart
./drivewise.sh
# Choose: 1 (Build local)
# Then: 2 (Run local)

# Check logs
./drivewise.sh
# Choose: 7 (View logs)
```

### Update Production (Raspberry Pi)

```bash
# Simple update
./drivewise.sh
# Choose: 6 (Deploy to Raspberry Pi)

# Script automatically:
# - Builds new version
# - Deploys to Pi
# - Restarts service
```

### Cleanup After Development

```bash
./drivewise.sh
# Choose: 9 (Clean up)
# Select: Deep clean (both local and remote)
```

## Troubleshooting

### SSH Connection Fails

**Problem:** Cannot connect to Raspberry Pi

**Solutions:**
```bash
# Test connection manually
ssh pi@[raspberry-pi-ip]

# Verify settings in .env
cat .env | grep RPI

# Check SSH service on Pi
ssh pi@[raspberry-pi-ip] 'sudo systemctl status ssh'
```

### Docker Build Fails

**Problem:** Build errors or timeouts

**Solutions:**
```bash
# Clean build cache
docker builder prune

# Rebuild manually
docker build --no-cache -t drivewise .

# Check Docker Desktop is running
docker info
```

### Port Conflict

**Problem:** Port 8800 already in use

**Solutions:**
```bash
# Find what's using the port
lsof -i :8800  # macOS/Linux
netstat -ano | findstr :8800  # Windows

# Change port in .env
echo "CONTAINER_PORT=8801" >> .env
```

### Raspberry Pi Out of Space

**Problem:** No space left on device

**Solutions:**
```bash
# SSH to Pi and clean up
ssh pi@[raspberry-pi-ip]

# Remove old images
docker image prune -a

# Remove old containers
docker container prune

# Check disk space
df -h
```

### sshpass Not Found

**Problem:** Script cannot install sshpass

**Solution (macOS):**
```bash
# Install Homebrew first
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install sshpass
brew install hudochenkov/sshpass/sshpass
```

**Solution (Linux):**
```bash
# Debian/Ubuntu
sudo apt install sshpass

# RedHat/CentOS
sudo yum install sshpass

# Arch Linux
sudo pacman -S sshpass
```

## Advanced Usage

### Custom Registry Deployment

1. **Configure registry in .env:**
   ```bash
   REGISTRY=ghcr.io/yourusername
   ```

2. **Login to registry:**
   ```bash
   docker login ghcr.io
   ```

3. **Build and push:**
   ```bash
   ./drivewise.sh
   # Choose: 5 (Build & push to registry)
   ```

4. **Pull on Raspberry Pi:**
   ```bash
   ssh pi@raspberry-pi-ip
   docker pull ghcr.io/yourusername/drivewise:latest
   docker run -d -p 8800:8800 --restart unless-stopped ghcr.io/yourusername/drivewise:latest
   ```

### Multiple Raspberry Pi Deployments

Deploy to multiple Raspberry Pis:

```bash
# Create environment files
cp .env .env.pi1
cp .env .env.pi2

# Edit each file with different Pi settings
nano .env.pi1  # RPI_HOST=192.168.1.100
nano .env.pi2  # RPI_HOST=192.168.1.101

# Deploy to first Pi
mv .env .env.backup
mv .env.pi1 .env
./drivewise.sh  # Choose: 6

# Deploy to second Pi
mv .env .env.pi1
mv .env.pi2 .env
./drivewise.sh  # Choose: 6

# Restore
mv .env .env.pi2
mv .env.backup .env
```

### Monitoring Multiple Instances

```bash
# Check status of all deployments
./drivewise.sh
# Choose: 8 (Check status)

# Or manually check each
docker ps  # Local
ssh pi@192.168.1.100 'docker ps'  # Pi 1
ssh pi@192.168.1.101 'docker ps'  # Pi 2
```

## Tips and Best Practices

1. **Regular Updates**
   - Keep Docker Desktop updated
   - Update Raspberry Pi OS: `sudo apt update && sudo apt upgrade`

2. **Backup Configuration**
   - Keep `.env` file backed up (securely)
   - Document custom configurations

3. **Security**
   - Use SSH keys instead of passwords for Pi access
   - Keep `.env` file out of version control
   - Use strong passwords

4. **Performance**
   - Use option 1-2 for rapid local development
   - Use option 6 for production deployments
   - Use option 9 regularly to free disk space

5. **Debugging**
   - Always check logs first (option 7)
   - Use status check (option 8) for quick health check
   - Enable debug mode in application if needed

## Script Architecture

The `drivewise.sh` script structure:

```
drivewise.sh
├── Color definitions
├── Environment loading (.env)
├── Utility functions
│   ├── SSH connectivity test
│   ├── Docker image checks
│   ├── Health check functions
│   └── Cleanup functions
├── Menu system
│   └── 10 interactive options
└── Error handling
```

## Additional Resources

- [Installation Guide](INSTALLATION.md) - Detailed installation instructions
- [Main README](README.md) - Project overview
- [Troubleshooting](INSTALLATION.md#troubleshooting) - Common issues and solutions

---

**DriveWise** - Smart travel, optimal costs. 🚗✨
