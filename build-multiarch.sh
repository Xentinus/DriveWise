#!/bin/bash

# DriveWise Multi-Platform Docker Image Builder

echo "🚗 DriveWise Multi-Platform Image Builder"
echo "========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create buildx builder if it doesn't exist
BUILDER_NAME="drivewise-multiarch"

if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "🔧 Creating multi-architecture builder..."
    docker buildx create --name $BUILDER_NAME --platform linux/amd64,linux/arm64 --use
else
    echo "✅ Multi-architecture builder already exists"
    docker buildx use $BUILDER_NAME
fi

# Get current date for tagging
DATE=$(date +%Y%m%d)
VERSION="v1.0.${DATE}"

# Image name and tags
IMAGE_NAME="drivewise"
REGISTRY_PREFIX="" # Add your registry here if needed (e.g., "yourusername/")

echo ""
echo "📦 Building images for multiple architectures:"
echo "   - linux/amd64 (Desktop Linux, macOS Intel/AMD)"
echo "   - linux/arm64 (Apple Silicon, Raspberry Pi 4/5)"
echo ""
echo "🏷️  Tags: latest, $VERSION"
echo ""

# Build and push multi-platform images
echo "🔨 Building multi-platform Docker images..."

# Build for local use (load only works with single platform)
echo "Building AMD64 version for local use..."
docker buildx build \
    --platform linux/amd64 \
    --tag ${REGISTRY_PREFIX}${IMAGE_NAME}:latest-amd64 \
    --tag ${REGISTRY_PREFIX}${IMAGE_NAME}:${VERSION}-amd64 \
    --load \
    .

if [ $? -eq 0 ]; then
    echo "✅ AMD64 image built successfully and loaded locally"
else
    echo "❌ Failed to build AMD64 image"
    exit 1
fi

# Build ARM64 version
echo "Building ARM64 version..."
docker buildx build \
    --platform linux/arm64 \
    --tag ${REGISTRY_PREFIX}${IMAGE_NAME}:latest-arm64 \
    --tag ${REGISTRY_PREFIX}${IMAGE_NAME}:${VERSION}-arm64 \
    --output type=docker,dest=${IMAGE_NAME}-arm64-${VERSION}.tar \
    .

if [ $? -eq 0 ]; then
    echo "✅ ARM64 image built successfully and saved as tar file"
    echo "📁 ARM64 image saved as: ${IMAGE_NAME}-arm64-${VERSION}.tar"
else
    echo "❌ Failed to build ARM64 image"
    exit 1
fi

echo ""
echo "🎉 Multi-platform build completed successfully!"
echo ""
echo "📋 Available images:"
echo "   Local AMD64: ${REGISTRY_PREFIX}${IMAGE_NAME}:latest-amd64"
echo "   ARM64 file: ${IMAGE_NAME}-arm64-${VERSION}.tar"
echo ""
echo "💡 Usage instructions:"
echo ""
echo "Desktop (AMD64) - Run locally:"
echo "   docker run -p 8800:8800 --name drivewise-app ${REGISTRY_PREFIX}${IMAGE_NAME}:latest-amd64"
echo ""
echo "Raspberry Pi (ARM64) - Transfer and load:"
echo "   1. Copy ${IMAGE_NAME}-arm64-${VERSION}.tar to your Raspberry Pi"
echo "   2. On Raspberry Pi: docker load < ${IMAGE_NAME}-arm64-${VERSION}.tar"
echo "   3. On Raspberry Pi: docker run -p 8800:8800 --name drivewise-app ${REGISTRY_PREFIX}${IMAGE_NAME}:latest-arm64"
echo ""
echo "🌐 Application will be available at: http://[device-ip]:8800"