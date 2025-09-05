#!/bin/bash

echo "=== Docker Permission Debug Script ==="
echo "Current user: $(whoami)"
echo "Current user ID: $(id)"
echo ""

echo "=== Docker Socket Information ==="
if [ -S /var/run/docker.sock ]; then
    echo "Docker socket exists: /var/run/docker.sock"
    echo "Socket permissions: $(ls -la /var/run/docker.sock)"
    echo "Socket group ID: $(stat -c %g /var/run/docker.sock)"
else
    echo "Docker socket NOT found"
fi
echo ""

echo "=== Docker Group Information ==="
if getent group docker > /dev/null 2>&1; then
    echo "Docker group exists:"
    getent group docker
    echo "Docker group ID: $(getent group docker | cut -d: -f3)"
else
    echo "Docker group does NOT exist"
fi
echo ""

echo "=== User Group Membership ==="
echo "Groups for current user: $(groups)"
echo "Detailed group info:"
id
echo ""

echo "=== Docker Command Tests ==="
echo "Testing docker --version:"
docker --version 2>&1 || echo "FAILED: docker --version"
echo ""

echo "Testing docker info:"
docker info 2>&1 || echo "FAILED: docker info"
echo ""

echo "Testing docker ps:"
docker ps 2>&1 || echo "FAILED: docker ps"
echo ""

echo "=== End Debug Script ==="
