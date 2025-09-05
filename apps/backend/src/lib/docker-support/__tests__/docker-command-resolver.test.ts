import { 
  resolveDockerCommand, 
  validateDockerArgs, 
  isDockerCommand, 
  processDockerEnvironment 
} from '../docker-command-resolver';

describe('Docker Command Resolver', () => {
  describe('isDockerCommand', () => {
    it('should identify docker commands', () => {
      expect(isDockerCommand('docker')).toBe(true);
      expect(isDockerCommand('Docker')).toBe(true);
      expect(isDockerCommand('DOCKER')).toBe(true);
      expect(isDockerCommand('npx')).toBe(false);
      expect(isDockerCommand('uvx')).toBe(false);
    });
  });

  describe('validateDockerArgs', () => {
    it('should validate docker run commands', () => {
      const args = ['run', 'myimage'];
      const result = validateDockerArgs(args);
      expect(result).toContain('run');
      expect(result).toContain('-i');
      expect(result).toContain('--rm');
      expect(result).toContain('myimage');
    });

    it('should preserve existing -i and --rm flags', () => {
      const args = ['run', '-i', '--rm', 'myimage'];
      const result = validateDockerArgs(args);
      expect(result.filter(arg => arg === '-i')).toHaveLength(1);
      expect(result.filter(arg => arg === '--rm')).toHaveLength(1);
    });

    it('should throw error for non-run commands', () => {
      expect(() => validateDockerArgs(['ps'])).toThrow('must start with');
      expect(() => validateDockerArgs([])).toThrow('must start with');
    });
  });

  describe('processDockerEnvironment', () => {
    it('should convert environment variables to -e flags', () => {
      const env = { API_KEY: 'secret', DEBUG: 'true' };
      const args = ['run', 'myimage'];
      const result = processDockerEnvironment(env, args);
      
      expect(result).toContain('-e');
      expect(result).toContain('API_KEY=secret');
      expect(result).toContain('DEBUG=true');
      expect(result).toContain('myimage');
    });

    it('should handle empty environment', () => {
      const args = ['run', 'myimage'];
      expect(processDockerEnvironment(null, args)).toEqual(args);
      expect(processDockerEnvironment(undefined, args)).toEqual(args);
      expect(processDockerEnvironment({}, args)).toEqual(args);
    });

    it('should insert environment variables after run and flags', () => {
      const env = { API_KEY: 'secret' };
      const args = ['run', '-i', '--rm', '-v', '/tmp:/tmp', 'myimage'];
      const result = processDockerEnvironment(env, args);
      
      const apiKeyIndex = result.indexOf('API_KEY=secret');
      const imageIndex = result.indexOf('myimage');
      expect(apiKeyIndex).toBeLessThan(imageIndex);
    });
  });

  describe('resolveDockerCommand', () => {
    it('should resolve valid docker run commands', () => {
      const result = resolveDockerCommand('docker', ['run', 'myimage']);
      expect(result.cmd).toBe('docker');
      expect(result.args).toEqual(['run', 'myimage']);
    });

    it('should throw error for non-run docker commands', () => {
      expect(() => resolveDockerCommand('docker', ['ps'])).toThrow('Only');
      expect(() => resolveDockerCommand('docker', [])).toThrow('Only');
    });

    it('should reject docker-compose commands', () => {
      expect(() => resolveDockerCommand('docker-compose', ['up'])).toThrow('not yet supported');
    });

    it('should fall back to spawn-rx for non-docker commands', () => {
      // This would normally call findActualExecutable, but we'll mock it
      // For now, just ensure it doesn't throw for non-docker commands
      expect(() => resolveDockerCommand('npx', ['some-package'])).not.toThrow();
    });
  });
});

describe('Docker Integration Examples', () => {
  it('should process GitHub MCP server configuration', () => {
    const command = 'docker';
    const args = ['run', 'ghcr.io/github/github-mcp-server'];
    const env = { 
      GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_xyz',
      GITHUB_TOOLSETS: 'all'
    };

    const validatedArgs = validateDockerArgs(args);
    const argsWithEnv = processDockerEnvironment(env, validatedArgs);
    const resolved = resolveDockerCommand(command, argsWithEnv);

    expect(resolved.cmd).toBe('docker');
    expect(resolved.args).toContain('run');
    expect(resolved.args).toContain('-i');
    expect(resolved.args).toContain('--rm');
    expect(resolved.args).toContain('-e');
    expect(resolved.args).toContain('GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xyz');
    expect(resolved.args).toContain('GITHUB_TOOLSETS=all');
    expect(resolved.args).toContain('ghcr.io/github/github-mcp-server');
  });

  it('should process filesystem MCP server with volumes', () => {
    const command = 'docker';
    const args = ['run', '-v', '/workspace:/workspace:ro', 'filesystem-server'];
    const env = {};

    const validatedArgs = validateDockerArgs(args);
    const argsWithEnv = processDockerEnvironment(env, validatedArgs);
    const resolved = resolveDockerCommand(command, argsWithEnv);

    expect(resolved.args).toContain('-v');
    expect(resolved.args).toContain('/workspace:/workspace:ro');
    expect(resolved.args).toContain('filesystem-server');
  });
});
