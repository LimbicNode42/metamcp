#!/bin/sh

set -e

echo "Starting MetaMCP services..."

# Function to setup Docker permissions
setup_docker_permissions() {
    echo "Setting up Docker permissions..."
    
    # Check if Docker socket exists
    if [ -S /var/run/docker.sock ]; then
        echo "Docker socket found at /var/run/docker.sock"
        
        # Get the group ID of the Docker socket
        DOCKER_SOCK_GID=$(stat -c %g /var/run/docker.sock)
        echo "Docker socket group ID: $DOCKER_SOCK_GID"
        
        # Check if docker group exists, if not create it with the correct GID
        if ! getent group docker > /dev/null 2>&1; then
            echo "Creating docker group with GID $DOCKER_SOCK_GID"
            addgroup --gid $DOCKER_SOCK_GID docker
        else
            # Modify existing docker group to match socket GID
            echo "Updating docker group to GID $DOCKER_SOCK_GID"
            groupmod -g $DOCKER_SOCK_GID docker 2>/dev/null || true
        fi
        
        # Add nextjs user to docker group
        echo "Adding nextjs user to docker group"
        usermod -aG docker nextjs 2>/dev/null || true
        
        # Test Docker access
        if su nextjs -c "docker ps" > /dev/null 2>&1; then
            echo "✅ Docker access confirmed for nextjs user"
        else
            echo "⚠️  Docker access test failed, but continuing..."
        fi
    else
        echo "⚠️  Docker socket not found - Docker functionality will not be available"
    fi
}

# Function to wait for postgres
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
        echo "PostgreSQL is not ready - sleeping 2 seconds"
        sleep 2
    done
    echo "PostgreSQL is ready!"
}

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."
    cd /app/apps/backend
    
    # Check if migrations need to be run
    if [ -d "drizzle" ] && [ "$(ls -A drizzle/*.sql 2>/dev/null)" ]; then
        echo "Found migration files, running migrations..."
        # Use local drizzle-kit since env vars are available at system level in Docker
        if pnpm exec drizzle-kit migrate; then
            echo "Migrations completed successfully!"
        else
            echo "❌ Migration failed! Exiting..."
            exit 1
        fi
    else
        echo "No migrations found or directory empty"
    fi
    
    cd /app
}

# Set default values for postgres connection if not provided
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}

# Setup Docker permissions first
setup_docker_permissions

# Wait for PostgreSQL
wait_for_postgres

# Run migrations
run_migrations

# Switch to nextjs user for running the application
echo "Switching to nextjs user for application startup..."

# Start backend in the background as nextjs user
echo "Starting backend server..."
cd /app/apps/backend
su nextjs -c "PORT=12009 node dist/index.js" &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend server died! Exiting..."
    exit 1
fi
echo "✅ Backend server started successfully (PID: $BACKEND_PID)"

# Start frontend
echo "Starting frontend server..."
cd /app/apps/frontend
su nextjs -c "PORT=12008 pnpm start" &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend is still running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend server died! Exiting..."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "✅ Frontend server started successfully (PID: $FRONTEND_PID)"

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped"
}

# Trap signals for graceful shutdown
trap cleanup TERM INT

echo "Services started successfully!"
echo "Backend running on port 12009"
echo "Frontend running on port 12008"

# Wait for both processes
wait $BACKEND_PID
wait $FRONTEND_PID 