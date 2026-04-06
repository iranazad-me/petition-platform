#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_HOST="root@91.107.243.10"
STAGING_DIR="/opt/iranazad"
CONTAINER_NAME="iranazad-app"
IMAGE_NAME="iranazad:staging"
SSH_TIMEOUT=5

echo "=========================================="
echo "  Iranazad Staging Deployment Script"
echo "=========================================="
echo ""

# Function to check SSH connectivity
check_ssh_connection() {
    echo -n "Checking SSH connection to $STAGING_HOST... "
    if ssh -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes "$STAGING_HOST" "echo 'Connection successful'" >/dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        echo -e "${YELLOW}Error: Cannot connect to staging server via SSH.${NC}"
        echo "Please ensure:"
        echo "  1. SSH key is configured: ssh-keygen -l -f ~/.ssh/id_rsa"
        echo "  2. SSH key is added to agent: ssh-add"
        echo "  3. Server is accessible: ssh $STAGING_HOST"
        return 1
    fi
}

# Function to build locally
build_locally() {
    echo ""
    echo -e "${YELLOW}Step 1: Building locally...${NC}"
    if pnpm build; then
        echo -e "${GREEN}Local build successful${NC}"
        return 0
    else
        echo -e "${RED}Local build failed${NC}"
        echo "Please fix build errors before deploying."
        return 1
    fi
}

# Function to copy source files
copy_source() {
    echo ""
    echo -e "${YELLOW}Step 2: Copying source files...${NC}"

    # Create staging directory if it doesn't exist
    ssh "$STAGING_HOST" "mkdir -p $STAGING_DIR/src" || {
        echo -e "${RED}Failed to create staging directory${NC}"
        return 1
    }

    # Copy source files using rsync
    if rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env.local' \
        --exclude '.env.production' \
        src/ "$STAGING_HOST:$STAGING_DIR/src/"; then
        echo -e "${GREEN}Source files copied${NC}"
    else
        echo -e "${RED}Failed to copy source files${NC}"
        return 1
    fi

    # Copy configuration files needed for Docker build
    if rsync -avz \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env.local' \
        --exclude '.env.production' \
        package.json \
        pnpm-lock.yaml \
        tsconfig.json \
        vite.config.ts \
        drizzle.config.ts \
        Dockerfile \
        scripts/ \
        "$STAGING_HOST:$STAGING_DIR/"; then
        echo -e "${GREEN}Configuration files copied${NC}"
        return 0
    else
        echo -e "${RED}Failed to copy configuration files${NC}"
        return 1
    fi
}

# Function to deploy on staging
deploy_on_staging() {
    echo ""
    echo -e "${YELLOW}Step 3: Deploying on staging server...${NC}"

    ssh "$STAGING_HOST" << ENDSSH
set -e

echo "Changing to staging directory..."
cd $STAGING_DIR

echo "Building Docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME . || {
    echo "Docker build failed"
    exit 1
}

echo "Stopping old container..."
docker stop $CONTAINER_NAME 2>/dev/null || true

echo "Removing old container..."
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "Starting new container..."
docker run -d --name $CONTAINER_NAME \\
    --link iranazad-db:postgres \\
    --env-file $STAGING_DIR/.env.staging \\
    -p 3000:3000 \\
    --restart unless-stopped \\
    --log-opt max-size=10m \\
    --log-opt max-file=3 \\
    $IMAGE_NAME || {
    echo "Failed to start container"
    exit 1
}

echo "Deployment completed successfully"
ENDSSH

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment on staging successful${NC}"
        return 0
    else
        echo -e "${RED}Deployment on staging failed${NC}"
        return 1
    fi
}

# Function to verify container health
verify_container_health() {
    echo ""
    echo -e "${YELLOW}Step 4: Verifying container health...${NC}"

    # Wait for container to start
    echo "Waiting for container to initialize..."
    sleep 3

    # Check if container is running
    RUNNING_STATUS=$(ssh "$STAGING_HOST" "docker inspect -f '{{.State.Running}}' $CONTAINER_NAME 2>/dev/null || echo 'false'")

    if [ "$RUNNING_STATUS" = "true" ]; then
        echo -e "${GREEN}Container is running${NC}"

        # Check container logs for errors
        echo ""
        echo "Recent container logs:"
        ssh "$STAGING_HOST" "docker logs --tail 20 $CONTAINER_NAME 2>&1" || true

        # Test HTTP endpoint
        echo ""
        echo -n "Testing HTTP endpoint... "
        HTTP_STATUS=$(ssh "$STAGING_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '000'" || echo "000")

        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "304" ]; then
            echo -e "${GREEN}OK (HTTP $HTTP_STATUS)${NC}"
        else
            echo -e "${YELLOW}Warning: HTTP status $HTTP_STATUS${NC}"
            echo "The application may still be starting up."
        fi

        return 0
    else
        echo -e "${RED}Container is not running${NC}"
        echo "Check logs with: ssh $STAGING_HOST 'docker logs $CONTAINER_NAME'"
        return 1
    fi
}

# Main execution
main() {
    # Check SSH connection first
    if ! check_ssh_connection; then
        exit 1
    fi

    # Build locally
    if ! build_locally; then
        exit 1
    fi

    # Copy source files
    if ! copy_source; then
        exit 1
    fi

    # Deploy on staging
    if ! deploy_on_staging; then
        exit 1
    fi

    # Verify container health
    if ! verify_container_health; then
        echo -e "${YELLOW}Warning: Deployment completed but health check failed${NC}"
        echo "Please check the container manually."
        exit 1
    fi

    # Success message
    echo ""
    echo "=========================================="
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo "=========================================="
    echo ""
    echo "Application URL: http://91.107.243.10:3000"
    echo ""
    echo "Useful commands:"
    echo "  View logs:   ssh $STAGING_HOST 'docker logs -f $CONTAINER_NAME'"
    echo "  SSH in:      ssh $STAGING_HOST"
    echo "  Restart:     ssh $STAGING_HOST 'docker restart $CONTAINER_NAME'"
    echo ""
}

# Run main function
main "$@"
