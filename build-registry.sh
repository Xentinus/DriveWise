#!/bin/bash

# DriveWise Multi-Platform Docker Registry Push

echo "🚗 DriveWise Registry Push Builder"
echo "================================="

# Configuration
IMAGE_NAME="drivewise"
REGISTRY="" # Set your registry here (e.g., "docker.io/yourusername" or "ghcr.io/yourusername")
DATE=$(date +%Y%m%d)
VERSION="v1.0.${DATE}"

# Prompt for registry if not set
if [ -z "$REGISTRY" ]; then
    echo "📝 Registry not configured in script."
    echo "Examples:"
    echo "  - Docker Hub: docker.io/yourusername"
    echo "  - GitHub Container Registry: ghcr.io/yourusername"
    echo "  - Leave empty for local build only"
    echo ""
    read -p "Enter your registry (or press Enter to skip): " REGISTRY
fi

if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
    echo "🎯 Target registry: $REGISTRY"
else
    FULL_IMAGE_NAME="$IMAGE_NAME"
    echo "🏠 Building for local use only"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create and use buildx builder
BUILDER_NAME="drivewise-multiarch"

if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "🔧 Creating multi-architecture builder..."
    docker buildx create --name $BUILDER_NAME --platform linux/amd64,linux/arm64 --use
else
    echo "✅ Using existing multi-architecture builder"
    docker buildx use $BUILDER_NAME
fi

echo ""
echo "📦 Building for platforms:"
echo "   - linux/amd64 (Desktop Linux, macOS Intel/AMD)"
echo "   - linux/arm64 (Apple Silicon, Raspberry Pi 4/5)"
echo ""
echo "🏷️  Tags: latest, $VERSION"
echo ""

# Build command based on registry configuration
if [ -n "$REGISTRY" ]; then
    echo "🚀 Building and pushing to registry..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag ${FULL_IMAGE_NAME}:latest \
        --tag ${FULL_IMAGE_NAME}:${VERSION} \
        --push \
        .
    
    if [ $? -eq 0 ]; then
        echo "✅ Multi-platform images built and pushed successfully!"
        echo ""
        echo "📋 Available images in registry:"
        echo "   ${FULL_IMAGE_NAME}:latest"
        echo "   ${FULL_IMAGE_NAME}:${VERSION}"
        echo ""
        echo "💡 Usage on any platform:"
        echo "   docker run -p 8800:8800 --name drivewise-app ${FULL_IMAGE_NAME}:latest"
    else
        echo "❌ Failed to build and push images"
        exit 1
    fi
else
    echo "🏠 Building for local use..."
    
    # Build AMD64 for local use
    docker buildx build \
        --platform linux/amd64 \
        --tag ${FULL_IMAGE_NAME}:latest \
        --tag ${FULL_IMAGE_NAME}:${VERSION} \
        --load \
        .
    
    if [ $? -eq 0 ]; then
        echo "✅ Local AMD64 image built successfully!"
        echo ""
        echo "💡 Usage:"
        echo "   docker run -p 8800:8800 --name drivewise-app ${FULL_IMAGE_NAME}:latest"
    else
        echo "❌ Failed to build local image"
        exit 1
    fi
fi

echo ""
echo "🌐 Application will be available at: http://localhost:8800"