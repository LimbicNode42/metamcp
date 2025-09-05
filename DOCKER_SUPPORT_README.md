# 🐳 Docker Support for MetaMCP

We've successfully added **Docker support** to MetaMCP! You can now run MCP servers in Docker containers as STDIO servers, providing better isolation, consistent environments, and easy distribution.

## 🚀 Quick Start

### Example: GitHub MCP Server

```json
{
  "name": "github-mcp-docker",
  "description": "GitHub integration via Docker",
  "type": "STDIO",
  "command": "docker",
  "args": "run -i --rm ghcr.io/github/github-mcp-server",
  "env": "GITHUB_PERSONAL_ACCESS_TOKEN=your-token-here\nGITHUB_TOOLSETS=all"
}
```

### What Happens Behind the Scenes

MetaMCP automatically:
1. ✅ Validates the Docker command (only `docker run` supported)
2. ✅ Adds essential flags: `-i` (interactive) and `--rm` (auto-cleanup)
3. ✅ Converts environment variables to Docker `-e` flags
4. ✅ Executes: `docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=your-token-here -e GITHUB_TOOLSETS=all ghcr.io/github/github-mcp-server`

## ✨ Features Implemented

### 🔧 Command Resolution
- **Custom Docker resolver** that handles Docker commands before falling back to spawn-rx
- **Automatic flag injection** (`-i`, `--rm`) for STDIO compatibility and cleanup
- **Environment variable processing** - converts env vars to `-e` flags
- **Validation** - ensures only `docker run` commands are supported

### 🎨 Frontend Enhancements
- **Smart placeholders** - Shows Docker-specific examples when command is "docker"
- **Interactive hints** - Displays Docker guidance and examples
- **Real-time feedback** - Updates UI based on command type

### 🏗️ Backend Infrastructure
- **ProcessManagedStdioTransport** - Enhanced to handle Docker containers
- **Environment handling** - Proper separation of container env vs process env
- **Error handling** - Docker-specific error messages and troubleshooting

## 📋 Supported Use Cases

### 1. GitHub MCP Server
```bash
Command: docker
Args: run -i --rm ghcr.io/github/github-mcp-server
Environment:
  GITHUB_PERSONAL_ACCESS_TOKEN=your-token
  GITHUB_TOOLSETS=all
```

### 2. Filesystem MCP Server with Volumes
```bash
Command: docker  
Args: run -i --rm -v /workspace:/workspace:ro ghcr.io/modelcontextprotocol/server-filesystem /workspace
```

### 3. Database MCP Server with Networking
```bash
Command: docker
Args: run -i --rm --network host ghcr.io/modelcontextprotocol/server-postgres
Environment:
  DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### 4. Custom MCP Server
```bash
Command: docker
Args: run -i --rm -p 8080:8080 my-custom-mcp:latest
Environment:
  API_KEY=${MY_API_KEY}
  DEBUG=true
```

## 🔍 Implementation Details

### Files Created/Modified

1. **`apps/backend/src/lib/docker-support/docker-command-resolver.ts`**
   - Core Docker command resolution logic
   - Environment variable processing
   - Validation and normalization

2. **`apps/backend/src/routers/mcp-proxy/server.ts`**
   - Integration with existing STDIO transport
   - Updated command resolution pipeline

3. **`apps/backend/src/lib/metamcp/client.ts`**
   - Client-side Docker handling
   - Environment variable injection

4. **`apps/frontend/app/[locale]/(sidebar)/mcp-servers/page.tsx`**
   - UI enhancements for Docker commands
   - Dynamic placeholders and hints

5. **`docs/en/concepts/docker-support.mdx`**
   - Comprehensive documentation
   - Examples and best practices

### Key Functions

- `isDockerCommand(command)` - Detects Docker commands
- `validateDockerArgs(args)` - Ensures required flags are present
- `processDockerEnvironment(env, args)` - Converts env vars to -e flags
- `resolveDockerCommand(command, args)` - Main resolution logic

## 🧪 Testing

### Manual Test Cases

1. **Basic Docker Command**
   ```
   Command: docker
   Args: run hello-world
   Expected: docker run -i --rm hello-world
   ```

2. **With Environment Variables**
   ```
   Command: docker
   Args: run nginx
   Env: PORT=8080, DEBUG=true
   Expected: docker run -i --rm -e PORT=8080 -e DEBUG=true nginx
   ```

3. **With Volume Mounts**
   ```
   Command: docker
   Args: run -v /tmp:/tmp alpine
   Expected: docker run -i --rm -v /tmp:/tmp alpine
   ```

### Error Scenarios

1. **Invalid Docker Command**
   ```
   Command: docker
   Args: ps
   Expected: Error - "Only 'docker run' commands are supported"
   ```

2. **Non-Docker Command** (should work normally)
   ```
   Command: npx
   Args: some-package
   Expected: Normal spawn-rx resolution
   ```

## 🎯 Next Steps for Upstream Contribution

1. **Create tests** - Add comprehensive test suite
2. **Documentation** - Update main docs with Docker examples  
3. **UI polish** - Enhance frontend with better Docker UX
4. **Error handling** - Improve error messages and troubleshooting
5. **Performance** - Optimize Docker command processing

## 🤝 Contributing to Upstream

This implementation is ready to be contributed to the upstream MetaMCP repository! The changes are:

- ✅ **Non-breaking** - Existing functionality unchanged
- ✅ **Well-documented** - Comprehensive docs and examples
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Tested** - Manual testing completed
- ✅ **User-friendly** - Enhanced UI for Docker users

### Pull Request Checklist

- [x] Implement Docker command resolution
- [x] Add environment variable processing  
- [x] Update frontend with Docker hints
- [x] Create comprehensive documentation
- [x] Test with real Docker images
- [ ] Add automated tests
- [ ] Update main README with Docker support
- [ ] Create migration guide for existing users

## 🔗 Example Configurations

Check out the `docs/en/concepts/docker-support.mdx` file for complete examples and best practices!

---

**This implementation enables MetaMCP users to leverage the full Docker ecosystem for MCP servers, providing better isolation, easier deployment, and access to pre-built MCP server images.** 🎉
