#!/bin/bash

# Test script to verify Docker-in-Docker functionality in MetaMCP
echo "Testing Docker-in-Docker functionality..."

# Test 1: Check if Docker is available
echo "1. Checking Docker availability..."
if docker --version; then
    echo "✅ Docker is available"
else
    echo "❌ Docker is not available"
    exit 1
fi

# Test 2: Check if we can run a simple container
echo "2. Testing Docker run capability..."
if docker run --rm hello-world; then
    echo "✅ Docker run works"
else
    echo "❌ Docker run failed"
    exit 1
fi

# Test 3: Check Docker socket permissions
echo "3. Checking Docker socket permissions..."
if [ -S /var/run/docker.sock ]; then
    echo "✅ Docker socket exists"
    ls -la /var/run/docker.sock
else
    echo "❌ Docker socket not found"
    exit 1
fi

# Test 4: Test Docker networking
echo "4. Testing Docker networking..."
if docker run --rm --add-host host.docker.internal:host-gateway alpine:latest ping -c 1 host.docker.internal; then
    echo "✅ Docker networking with host.docker.internal works"
else
    echo "⚠️  Docker networking test failed (this may be expected in some environments)"
fi

echo "Docker-in-Docker test completed!"
