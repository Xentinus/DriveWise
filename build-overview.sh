#!/bin/bash

# DriveWise Build & Deploy Overview

echo "🚗 DriveWise Docker Build & Deploy Options"
echo "==========================================="
echo ""

echo "📋 Available build scripts:"
echo ""
echo "1. 🖥️  Single platform (current system):"
echo "   ./run-docker.sh          - Quick build and run locally"
echo "   ./stop-docker.sh         - Stop and cleanup"
echo ""
echo "2. 🌍 Multi-platform (AMD64 + ARM64):"
echo "   ./build-multiarch.sh     - Build for desktop and Raspberry Pi"
echo "   ./build-registry.sh      - Build and push to Docker registry"
echo ""
echo "3. 🐳 Docker Compose:"
echo "   docker-compose up --build         - Desktop version"
echo "   docker-compose -f docker-compose.rpi.yml up  - Raspberry Pi version"
echo ""

echo "📱 Target platforms:"
echo "   • AMD64: Intel/AMD Linux, macOS Intel, Windows"
echo "   • ARM64: Apple Silicon, Raspberry Pi 4/5"
echo ""

echo "📚 Documentation:"
echo "   • DOCKER_README.md         - General Docker usage"
echo "   • RASPBERRY_PI_INSTALL.md  - Raspberry Pi specific guide"
echo "   • NETWORK_REQUIREMENTS.md  - Network and API dependencies"
echo ""

echo "🎯 Quick start:"
echo "   For local development:  ./run-docker.sh"
echo "   For Raspberry Pi:       ./build-multiarch.sh"
echo "   For production:         ./build-registry.sh"
echo ""

echo "🌐 All versions accessible at: http://[host-ip]:8800"
echo "🔗 External API access enabled for weather, fuel prices, and maps"