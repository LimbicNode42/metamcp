# Docker-in-Docker Support for MetaMCP

MetaMCP now supports running Docker-based MCP servers by mounting the Docker socket and providing the necessary Docker daemon access from within the MetaMCP container.

## Architecture

The Docker-in-Docker (DinD) implementation uses Docker socket mounting rather than true Docker-in-Docker to avoid security and complexity issues:

- **Docker Socket Mount**: The host Docker socket (`/var/run/docker.sock`) is mounted into the MetaMCP container
- **Docker Client**: The MetaMCP container includes the Docker CLI client
- **Networking**: Special networking configuration ensures containers can communicate with the host

## Configuration

### Environment Variables

- `DOCKER_HOST`: Set to `unix:///var/run/docker.sock`
- `TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL`: Set to `true` to enable automatic localhost transformation

### Docker Compose

Both production and development Docker Compose files include:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
environment:
  - DOCKER_HOST=unix:///var/run/docker.sock
  - TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL=true
extra_hosts:
  - "host.docker.internal:host-gateway"
```

## How It Works

1. **Command Detection**: The Docker command resolver detects when an MCP server uses Docker commands
2. **Argument Processing**: Docker run arguments are automatically enhanced with necessary flags:
   - `-i` for interactive mode (required for STDIO communication)
   - `--rm` for automatic cleanup
   - `--add-host host.docker.internal:host-gateway` for host networking (when enabled)
3. **Execution**: Docker commands are executed using the mounted Docker socket

## Testing

### Automated Tests

Test Docker functionality using the built-in endpoints:

```bash
# Check if Docker is accessible
curl http://localhost:12009/docker-test/check

# Run comprehensive Docker tests
curl http://localhost:12009/docker-test/test

# Get Docker daemon information
curl http://localhost:12009/docker-test/info
```

### Manual Testing

You can also test manually using the provided shell script:

```bash
# Run the Docker test script inside the container
docker exec -it metamcp /app/test-docker-in-docker.sh
```

## Security Considerations

### Permissions

The MetaMCP container runs with Docker socket access, which provides significant privileges:

- The container can start/stop any Docker container on the host
- The container can access Docker networks and volumes
- This is equivalent to root access on the host system

### Mitigation Strategies

1. **User Separation**: The MetaMCP container runs as a non-root user (`nextjs`)
2. **Network Isolation**: Use Docker networks to isolate MCP server containers
3. **Resource Limits**: Set appropriate CPU and memory limits on MCP server containers
4. **Image Validation**: Only allow trusted Docker images for MCP servers

## Production Deployment

### Prerequisites

- Docker daemon running on the host
- Docker socket accessible at `/var/run/docker.sock`
- Host networking support (for `host.docker.internal`)

### Deployment

Use the provided `docker-compose.yml`:

```bash
docker-compose up -d
```

### Monitoring

Monitor Docker usage through:

- MetaMCP logs: Check for Docker command execution
- Docker daemon logs: Monitor container creation/destruction
- System resources: Watch CPU/memory usage of spawned containers

## Development

### Local Development

Use the development compose file:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Adding Docker Support to MCP Servers

When configuring MCP servers that use Docker:

1. **Command Format**: Use standard Docker run commands
2. **Interactive Mode**: Ensure STDIO-based servers work with `-i` flag
3. **Networking**: Use `host.docker.internal` to access MetaMCP from within containers
4. **Cleanup**: The `--rm` flag is automatically added for cleanup

### Example MCP Server Configuration

```json
{
  "name": "docker-mcp-server",
  "command": "docker",
  "args": ["run", "-i", "my-mcp-image:latest"],
  "transport": "stdio"
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the Docker socket is accessible and the user is in the docker group
2. **Container Not Found**: Check that the Docker image exists and is accessible
3. **Network Issues**: Verify `host.docker.internal` resolution and networking configuration
4. **Resource Limits**: Check if containers are hitting CPU/memory limits

### Debug Endpoints

Use the debug endpoints to diagnose issues:

- `/docker-test/check`: Quick accessibility check
- `/docker-test/test`: Comprehensive functionality test
- `/docker-test/info`: Docker daemon information

### Logs

Check MetaMCP logs for Docker-related errors:

```bash
docker logs metamcp
```

## Limitations

1. **Security**: Docker socket access provides significant host privileges
2. **Performance**: Additional overhead from Docker layering
3. **Complexity**: More complex setup and troubleshooting
4. **Platform**: Currently tested on Linux environments only

## Future Improvements

- [ ] Support for Docker API instead of socket mounting
- [ ] Container resource limit enforcement
- [ ] Docker image security scanning
- [ ] Alternative container runtimes (Podman, containerd)
- [ ] Windows and macOS support improvements
