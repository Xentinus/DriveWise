#!/bin/bash

# DriveWise Unified Management Script
# This script provides a unified interface for all DriveWise Docker operations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment variables from .env file
load_env() {
    local ENV_FILE="${SCRIPT_DIR}/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Error: .env file not found!${NC}"
        echo -e "${YELLOW}📝 Please create a .env file based on .env.example:${NC}"
        echo "   cp .env.example .env"
        echo "   # Then edit .env with your configuration"
        exit 1
    fi
    
    # Load variables
    export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | xargs)
    
    # Validate required variables
    if [ -z "$RPI_HOST" ] || [ -z "$RPI_USER" ] || [ -z "$RPI_PASSWORD" ]; then
        echo -e "${RED}❌ Error: Missing required variables in .env file${NC}"
        echo "   Required: RPI_HOST, RPI_USER, RPI_PASSWORD"
        exit 1
    fi
    
    # Set defaults if not provided
    IMAGE_NAME=${IMAGE_NAME:-drivewise}
    CONTAINER_NAME=${CONTAINER_NAME:-drivewise-app}
    CONTAINER_PORT=${CONTAINER_PORT:-8800}
}

# Print header
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}      ${CYAN}🚗 DriveWise Management Tool${NC}         ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo ""
}

# Print menu
print_menu() {
    echo -e "${CYAN}Válassz egy műveletet:${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 🏗️  Build local (AMD64) - Helyi build"
    echo -e "  ${GREEN}2)${NC} 🚀 Run local - Helyi futtatás"
    echo -e "  ${GREEN}3)${NC} 🛑 Stop local - Helyi leállítás"
    echo -e "  ${GREEN}4)${NC} 📦 Build multi-arch - Több architektúra build"
    echo -e "  ${GREEN}5)${NC} 🌐 Build & push to registry - Registry-be push"
    echo -e "  ${GREEN}6)${NC} 🍓 Deploy to Raspberry Pi - Pi-re telepítés"
    echo -e "  ${GREEN}7)${NC} 📋 View logs - Logok megtekintése"
    echo -e "  ${GREEN}8)${NC} 🔍 Check status - Státusz ellenőrzés"
    echo -e "  ${GREEN}9)${NC} 🧹 Clean up - Takarítás"
    echo -e "  ${GREEN}0)${NC} ❌ Exit - Kilépés"
    echo ""
    echo -n "Válassz (0-9): "
}

# Function to run SSH commands
run_ssh_command() {
    local command="$1"
    sshpass -p "${RPI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${RPI_USER}@${RPI_HOST}" "${command}"
}

# Function to copy files via SCP
copy_file() {
    local src="$1"
    local dest="$2"
    sshpass -p "${RPI_PASSWORD}" scp -o StrictHostKeyChecking=no "${src}" "${RPI_USER}@${RPI_HOST}:${dest}"
}

# Check prerequisites
check_prerequisites() {
    local missing=0
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        missing=1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# 1. Build local (AMD64)
build_local() {
    echo -e "${CYAN}🏗️  Building local AMD64 image...${NC}"
    echo ""
    
    check_prerequisites
    
    if docker build -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:local .; then
        echo ""
        echo -e "${GREEN}✅ Local image built successfully!${NC}"
        echo -e "   Tag: ${IMAGE_NAME}:latest"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# 2. Run local
run_local() {
    echo -e "${CYAN}🚀 Starting local container...${NC}"
    echo ""
    
    check_prerequisites
    
    # Check if container is already running
    if docker ps -q -f name=${CONTAINER_NAME} > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Container is already running${NC}"
        read -p "Stop and restart? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker stop ${CONTAINER_NAME}
            docker rm ${CONTAINER_NAME}
        else
            echo "Cancelled"
            return
        fi
    fi
    
    # Check if image exists
    if ! docker images -q ${IMAGE_NAME}:latest > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Image not found. Building first...${NC}"
        build_local
    fi
    
    echo "Starting container on port ${CONTAINER_PORT}..."
    if docker run -d \
        -p ${CONTAINER_PORT}:${CONTAINER_PORT} \
        --network bridge \
        --name ${CONTAINER_NAME} \
        -e ASPNETCORE_ENVIRONMENT=Development \
        -e ASPNETCORE_URLS=http://+:${CONTAINER_PORT} \
        ${IMAGE_NAME}:latest; then
        echo ""
        echo -e "${GREEN}✅ Container started successfully!${NC}"
        echo -e "${CYAN}🌐 Application: http://localhost:${CONTAINER_PORT}${NC}"
        echo ""
        echo "Useful commands:"
        echo "  View logs: docker logs -f ${CONTAINER_NAME}"
        echo "  Stop: docker stop ${CONTAINER_NAME}"
    else
        echo -e "${RED}❌ Failed to start container${NC}"
        exit 1
    fi
}

# 3. Stop local
stop_local() {
    echo -e "${CYAN}🛑 Stopping local container...${NC}"
    echo ""
    
    if docker ps -q -f name=${CONTAINER_NAME} > /dev/null 2>&1; then
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        echo -e "${GREEN}✅ Container stopped and removed${NC}"
    else
        echo -e "${YELLOW}⚠️  No running container found${NC}"
    fi
}

# 4. Build multi-arch
build_multiarch() {
    echo -e "${CYAN}📦 Building multi-architecture images...${NC}"
    echo ""
    
    check_prerequisites
    
    # Create buildx builder if needed
    BUILDER_NAME="drivewise-multiarch"
    
    if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
        echo "🔧 Creating multi-architecture builder..."
        docker buildx create --name $BUILDER_NAME --platform linux/amd64,linux/arm64 --use
    else
        echo -e "${GREEN}✅ Using existing builder${NC}"
        docker buildx use $BUILDER_NAME
    fi
    
    DATE=$(date +%Y%m%d_%H%M%S)
    VERSION="v1.0.${DATE}"
    
    echo ""
    echo "Building for platforms:"
    echo "  - linux/amd64 (Desktop)"
    echo "  - linux/arm64 (Raspberry Pi)"
    echo ""
    
    # Build AMD64
    echo "🔨 Building AMD64..."
    docker buildx build \
        --platform linux/amd64 \
        --tag ${IMAGE_NAME}:latest-amd64 \
        --tag ${IMAGE_NAME}:${VERSION}-amd64 \
        --load \
        .
    
    # Build ARM64
    echo "🔨 Building ARM64..."
    TAR_FILE="${IMAGE_NAME}-arm64-${VERSION}.tar"
    docker buildx build \
        --platform linux/arm64 \
        --tag ${IMAGE_NAME}:latest-arm64 \
        --tag ${IMAGE_NAME}:${VERSION}-arm64 \
        --output type=docker,dest=${TAR_FILE} \
        .
    
    echo ""
    echo -e "${GREEN}✅ Multi-arch build completed!${NC}"
    echo -e "   AMD64: ${IMAGE_NAME}:latest-amd64"
    echo -e "   ARM64: ${TAR_FILE}"
}

# 5. Build and push to registry
build_registry() {
    echo -e "${CYAN}🌐 Building and pushing to registry...${NC}"
    echo ""
    
    check_prerequisites
    
    if [ -z "$REGISTRY" ]; then
        echo -e "${YELLOW}⚠️  No registry configured in .env${NC}"
        echo "Examples:"
        echo "  - Docker Hub: docker.io/yourusername"
        echo "  - GitHub Container Registry: ghcr.io/yourusername"
        echo ""
        read -p "Enter registry URL (or Enter to skip): " REGISTRY
        
        if [ -z "$REGISTRY" ]; then
            echo "Cancelled"
            return
        fi
    fi
    
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
    DATE=$(date +%Y%m%d)
    VERSION="v1.0.${DATE}"
    
    # Create buildx builder if needed
    BUILDER_NAME="drivewise-multiarch"
    
    if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
        echo "🔧 Creating multi-architecture builder..."
        docker buildx create --name $BUILDER_NAME --platform linux/amd64,linux/arm64 --use
    else
        docker buildx use $BUILDER_NAME
    fi
    
    echo "🚀 Building and pushing to: ${FULL_IMAGE_NAME}"
    echo "Tags: latest, ${VERSION}"
    echo ""
    
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag ${FULL_IMAGE_NAME}:latest \
        --tag ${FULL_IMAGE_NAME}:${VERSION} \
        --push \
        .
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Images pushed successfully!${NC}"
        echo -e "   ${FULL_IMAGE_NAME}:latest"
        echo -e "   ${FULL_IMAGE_NAME}:${VERSION}"
    else
        echo -e "${RED}❌ Push failed${NC}"
        exit 1
    fi
}

# 6. Deploy to Raspberry Pi
deploy_to_rpi() {
    echo -e "${CYAN}🍓 Deploying to Raspberry Pi...${NC}"
    echo -e "Target: ${RPI_USER}@${RPI_HOST}"
    echo ""
    
    check_prerequisites
    
    # Check for sshpass
    if ! command -v sshpass &> /dev/null; then
        echo -e "${YELLOW}⚠️  sshpass not installed. Installing...${NC}"
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo -e "${RED}❌ Cannot install sshpass. Please install Homebrew first.${NC}"
            exit 1
        fi
    fi
    
    # Step 1: Build ARM64 image
    echo -e "${CYAN}📦 Step 1: Building ARM64 image...${NC}"
    
    BUILDER_NAME="drivewise-multiarch"
    if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
        echo "🔧 Creating builder..."
        docker buildx create --name $BUILDER_NAME --platform linux/amd64,linux/arm64 --use
    else
        docker buildx use $BUILDER_NAME
    fi
    
    DATE=$(date +%Y%m%d_%H%M%S)
    VERSION="rpi-${DATE}"
    TAR_FILE="${IMAGE_NAME}-arm64-${VERSION}.tar"
    
    docker buildx build \
        --platform linux/arm64 \
        --tag ${IMAGE_NAME}:latest-arm64 \
        --tag ${IMAGE_NAME}:${VERSION} \
        --output type=docker,dest=${TAR_FILE} \
        .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ ARM64 image built: ${TAR_FILE}${NC}"
    
    # Step 2: Test SSH connection
    echo ""
    echo -e "${CYAN}🔗 Step 2: Testing SSH connection...${NC}"
    
    if run_ssh_command "echo 'Connection OK'"; then
        echo -e "${GREEN}✅ SSH connection successful${NC}"
    else
        echo -e "${RED}❌ SSH connection failed${NC}"
        echo "Check: network, SSH service, credentials"
        exit 1
    fi
    
    # Step 3: Upload image
    echo ""
    echo -e "${CYAN}📤 Step 3: Uploading image to Pi...${NC}"
    echo "This may take several minutes..."
    
    if copy_file "${TAR_FILE}" "/tmp/${TAR_FILE}"; then
        echo -e "${GREEN}✅ Upload complete${NC}"
    else
        echo -e "${RED}❌ Upload failed${NC}"
        exit 1
    fi
    
    # Step 4: Clean up old containers
    echo ""
    echo -e "${CYAN}🧹 Step 4: Cleaning up old containers...${NC}"
    
    run_ssh_command "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
    run_ssh_command "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
    run_ssh_command "docker rmi \$(docker images | grep '${IMAGE_NAME}' | awk '{print \$3}') 2>/dev/null || true"
    run_ssh_command "docker system prune -f"
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    
    # Step 5: Load and run new image
    echo ""
    echo -e "${CYAN}🚀 Step 5: Loading and starting container...${NC}"
    
    run_ssh_command "docker load < /tmp/${TAR_FILE}"
    
    run_ssh_command "docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p ${CONTAINER_PORT}:${CONTAINER_PORT} \
        -e ASPNETCORE_ENVIRONMENT=Production \
        -e ASPNETCORE_URLS=http://+:${CONTAINER_PORT} \
        --network host \
        --dns 8.8.8.8 \
        --dns 8.8.4.4 \
        ${IMAGE_NAME}:latest-arm64"
    
    echo -e "${GREEN}✅ Container started${NC}"
    
    # Clean up uploaded tar
    run_ssh_command "rm /tmp/${TAR_FILE}"
    
    # Step 6: Health check
    echo ""
    echo -e "${CYAN}🏥 Step 6: Health check...${NC}"
    echo "Waiting 10 seconds..."
    sleep 10
    
    CONTAINER_STATUS=$(run_ssh_command "docker ps --filter name=${CONTAINER_NAME} --format '{{.Status}}'")
    
    if [[ $CONTAINER_STATUS == *"Up"* ]]; then
        echo -e "${GREEN}✅ Container is running: $CONTAINER_STATUS${NC}"
    else
        echo -e "${RED}❌ Container is not running${NC}"
        run_ssh_command "docker logs ${CONTAINER_NAME}"
        exit 1
    fi
    
    # Test HTTP endpoint
    HTTP_STATUS=$(run_ssh_command "curl -s -o /dev/null -w '%{http_code}' http://localhost:${CONTAINER_PORT}/ || echo 'FAILED'")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        echo -e "${GREEN}✅ Application is responding (HTTP 200)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP status: $HTTP_STATUS${NC}"
    fi
    
    # Clean up local tar file
    echo ""
    echo "🧹 Cleaning up local files..."
    rm -f "${TAR_FILE}"
    
    # Summary
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}      ${CYAN}🎉 Deployment Complete!${NC}                ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 Application URL:${NC} http://${RPI_HOST}:${CONTAINER_PORT}"
    echo ""
    echo "Useful commands:"
    echo "  Check status: ssh ${RPI_USER}@${RPI_HOST} 'docker ps'"
    echo "  View logs: ssh ${RPI_USER}@${RPI_HOST} 'docker logs ${CONTAINER_NAME}'"
    echo "  Restart: ssh ${RPI_USER}@${RPI_HOST} 'docker restart ${CONTAINER_NAME}'"
}

# 7. View logs
view_logs() {
    echo -e "${CYAN}📋 View Logs${NC}"
    echo ""
    echo "Select location:"
    echo "  1) Local"
    echo "  2) Raspberry Pi"
    echo ""
    read -p "Choose (1-2): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${CYAN}Local logs:${NC}"
            if docker ps -q -f name=${CONTAINER_NAME} > /dev/null 2>&1; then
                docker logs -f ${CONTAINER_NAME}
            else
                echo -e "${YELLOW}⚠️  No running container found${NC}"
            fi
            ;;
        2)
            echo ""
            echo -e "${CYAN}Raspberry Pi logs:${NC}"
            if command -v sshpass &> /dev/null; then
                run_ssh_command "docker logs -f ${CONTAINER_NAME}"
            else
                echo -e "${RED}❌ sshpass not installed${NC}"
            fi
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

# 8. Check status
check_status() {
    echo -e "${CYAN}🔍 Status Check${NC}"
    echo ""
    
    # Local status
    echo -e "${CYAN}Local Container:${NC}"
    if docker ps -f name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ${CONTAINER_NAME} > /dev/null 2>&1; then
        docker ps -f name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Not running${NC}"
    fi
    
    echo ""
    
    # Raspberry Pi status
    echo -e "${CYAN}Raspberry Pi Container:${NC}"
    if command -v sshpass &> /dev/null; then
        if run_ssh_command "docker ps -f name=${CONTAINER_NAME} --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null | grep ${CONTAINER_NAME} > /dev/null; then
            run_ssh_command "docker ps -f name=${CONTAINER_NAME} --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
            echo -e "${GREEN}✅ Running on ${RPI_HOST}${NC}"
        else
            echo -e "${YELLOW}⚠️  Not running or cannot connect${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  sshpass not installed - cannot check remote status${NC}"
    fi
}

# 9. Clean up
cleanup() {
    echo -e "${CYAN}🧹 Cleanup${NC}"
    echo ""
    echo "Select cleanup scope:"
    echo "  1) Local only"
    echo "  2) Raspberry Pi only"
    echo "  3) Both"
    echo "  4) Deep clean (remove images too)"
    echo ""
    read -p "Choose (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo "Cleaning up local..."
            docker stop ${CONTAINER_NAME} 2>/dev/null || true
            docker rm ${CONTAINER_NAME} 2>/dev/null || true
            echo -e "${GREEN}✅ Local cleanup done${NC}"
            ;;
        2)
            echo ""
            echo "Cleaning up Raspberry Pi..."
            if command -v sshpass &> /dev/null; then
                run_ssh_command "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
                run_ssh_command "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
                run_ssh_command "docker system prune -f"
                echo -e "${GREEN}✅ Raspberry Pi cleanup done${NC}"
            else
                echo -e "${RED}❌ sshpass not installed${NC}"
            fi
            ;;
        3)
            echo ""
            echo "Cleaning up local..."
            docker stop ${CONTAINER_NAME} 2>/dev/null || true
            docker rm ${CONTAINER_NAME} 2>/dev/null || true
            echo -e "${GREEN}✅ Local cleanup done${NC}"
            
            echo ""
            echo "Cleaning up Raspberry Pi..."
            if command -v sshpass &> /dev/null; then
                run_ssh_command "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
                run_ssh_command "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
                run_ssh_command "docker system prune -f"
                echo -e "${GREEN}✅ Raspberry Pi cleanup done${NC}"
            else
                echo -e "${RED}❌ sshpass not installed${NC}"
            fi
            ;;
        4)
            echo ""
            echo -e "${RED}⚠️  This will remove all images and containers!${NC}"
            read -p "Are you sure? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "Deep cleaning local..."
                docker stop ${CONTAINER_NAME} 2>/dev/null || true
                docker rm ${CONTAINER_NAME} 2>/dev/null || true
                docker rmi $(docker images | grep ${IMAGE_NAME} | awk '{print $3}') 2>/dev/null || true
                docker system prune -af
                echo -e "${GREEN}✅ Deep cleanup done${NC}"
            fi
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

# Main function
main() {
    # Load environment first
    load_env
    
    print_header
    
    while true; do
        echo ""
        print_menu
        read choice
        echo ""
        
        case $choice in
            1) build_local ;;
            2) run_local ;;
            3) stop_local ;;
            4) build_multiarch ;;
            5) build_registry ;;
            6) deploy_to_rpi ;;
            7) view_logs ;;
            8) check_status ;;
            9) cleanup ;;
            0) 
                echo -e "${CYAN}👋 Viszlát!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Érvénytelen választás${NC}"
                ;;
        esac
        
        echo ""
        read -p "Nyomj Enter-t a folytatáshoz..."
    done
}

# Run main function
main
