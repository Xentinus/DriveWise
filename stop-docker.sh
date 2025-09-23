#!/bin/bash

# DriveWise Docker Stop Script

echo "🛑 Stopping DriveWise Docker container..."

# Check if container exists and is running
if docker ps -q -f name=drivewise-app > /dev/null; then
    echo "Stopping running container..."
    docker stop drivewise-app
    echo "✅ Container stopped"
else
    echo "⚠️  No running DriveWise container found"
fi

# Check if container exists (stopped)
if docker ps -aq -f name=drivewise-app > /dev/null; then
    echo "Removing container..."
    docker rm drivewise-app
    echo "✅ Container removed"
fi

echo "🧹 DriveWise container cleanup complete"