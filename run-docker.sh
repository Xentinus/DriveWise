#!/bin/bash

# DriveWise Docker Setup and Run Script

echo "🚗 DriveWise Docker Setup"
echo "========================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Build the image
echo "🔨 Building Docker image..."
if docker build -t drivewise .; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Check if container is already running
if docker ps -q -f name=drivewise-app > /dev/null; then
    echo "⚠️  DriveWise container is already running. Stopping it first..."
    docker stop drivewise-app
    docker rm drivewise-app
fi

# Run the container
echo "🚀 Starting DriveWise container on port 8800..."
if docker run -d -p 8800:8800 --network bridge --name drivewise-app drivewise; then
    echo "✅ DriveWise is now running!"
    echo "🌐 Open your browser and go to: http://localhost:8800"
    echo "🔗 External API access enabled for weather, fuel prices, and maps"
    echo ""
    echo "Useful commands:"
    echo "  Stop container:    docker stop drivewise-app"
    echo "  View logs:         docker logs -f drivewise-app"
    echo "  Remove container:  docker rm drivewise-app"
else
    echo "❌ Failed to start container"
    exit 1
fi