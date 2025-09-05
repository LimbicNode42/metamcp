import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Test Docker-in-Docker functionality from within the MetaMCP application
 */
export async function testDockerInDocker(): Promise<boolean> {
  try {
    console.log('🐳 Testing Docker-in-Docker functionality...');
    
    // Test 1: Check Docker version
    console.log('1. Checking Docker version...');
    const { stdout: versionOutput } = await execAsync('docker --version');
    console.log(`✅ Docker version: ${versionOutput.trim()}`);
    
    // Test 2: Test simple container run
    console.log('2. Testing simple container run...');
    const { stdout: helloOutput } = await execAsync('docker run --rm hello-world');
    console.log('✅ Hello world container executed successfully');
    
    // Test 3: Test with networking (similar to what MCP servers might need)
    console.log('3. Testing container with networking...');
    await execAsync('docker run --rm --add-host host.docker.internal:host-gateway alpine:latest echo "Network test passed"');
    console.log('✅ Container networking test passed');
    
    // Test 4: Test interactive mode (needed for MCP STDIO)
    console.log('4. Testing interactive mode...');
    await execAsync('docker run --rm -i alpine:latest echo "Interactive test passed"');
    console.log('✅ Interactive mode test passed');
    
    console.log('🎉 All Docker-in-Docker tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Docker-in-Docker test failed:', error);
    return false;
  }
}

/**
 * Get Docker daemon information
 */
export async function getDockerInfo(): Promise<any> {
  try {
    const { stdout } = await execAsync('docker info --format "{{json .}}"');
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to get Docker info:', error);
    return null;
  }
}

/**
 * Check if Docker daemon is accessible
 */
export async function isDockerAccessible(): Promise<boolean> {
  try {
    await execAsync('docker ps');
    return true;
  } catch (error) {
    return false;
  }
}
