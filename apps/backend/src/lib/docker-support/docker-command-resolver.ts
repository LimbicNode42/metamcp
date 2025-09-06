import { findActualExecutable } from "spawn-rx";

/**
 * Resolves Docker commands for MCP servers running in containers
 * This function handles Docker-specific command resolution before falling back to spawn-rx
 */
export function resolveDockerCommand(
  command: string,
  args: string[],
): { cmd: string; args: string[] } {
  // Handle Docker commands
  if (command.toLowerCase() === "docker") {
    // Validate that this is a Docker run command for MCP servers
    if (args.length > 0 && args[0] === "run") {
      // This is a valid docker run command
      return { cmd: "docker", args };
    } else {
      throw new Error(
        "Only 'docker run' commands are supported for MCP servers. Please use 'docker' as command and include 'run' as the first argument.",
      );
    }
  }

  // Handle docker-compose commands (for future support)
  if (command.toLowerCase() === "docker-compose") {
    throw new Error(
      "docker-compose is not yet supported. Please use 'docker run' commands for MCP servers.",
    );
  }

  // For non-Docker commands, fall back to spawn-rx resolution
  return findActualExecutable(command, args);
}

/**
 * Validates and normalizes Docker run arguments for MCP servers
 * Also handles Docker-in-Docker networking considerations
 */
export function validateDockerArgs(args: string[]): string[] {
  if (args.length === 0 || args[0] !== "run") {
    throw new Error("Docker commands must start with 'run'");
  }

  const normalizedArgs = [...args];

  // Ensure essential flags are present for MCP server compatibility
  if (!normalizedArgs.includes("-i")) {
    // Add interactive flag if not present (needed for STDIO communication)
    normalizedArgs.splice(1, 0, "-i");
  }

  if (!normalizedArgs.includes("--rm")) {
    // Add auto-removal flag if not present (for cleanup)
    normalizedArgs.splice(1, 0, "--rm");
  }

  // Handle Docker-in-Docker networking
  // If we're running inside Docker and the container needs to access host services
  if (process.env.TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL === "true") {
    // Add extra hosts mapping for containers that need to access the host
    if (!normalizedArgs.some(arg => arg.includes("--add-host"))) {
      normalizedArgs.splice(1, 0, "--add-host", "host.docker.internal:host-gateway");
    }
  }

  return normalizedArgs;
}

/**
 * Processes environment variables for Docker containers
 * Converts Record<string, string> to Docker -e flags
 */
export function processDockerEnvironment(
  env: Record<string, string> | null | undefined,
  args: string[],
): string[] {
  if (!env || Object.keys(env).length === 0) {
    return args;
  }

  console.log("[Docker] Processing environment variables:", env);
  console.log("[Docker] Original args:", args);

  const processedArgs = [...args];
  const runIndex = processedArgs.indexOf("run");
  
  if (runIndex === -1) {
    console.log("[Docker] No 'run' command found in args");
    return processedArgs;
  }

  // Find the insertion point after 'run' and any existing flags
  let insertIndex = runIndex + 1;
  
  // Skip existing flags and their values to find where the image name starts
  while (insertIndex < processedArgs.length) {
    const arg = processedArgs[insertIndex];
    
    // If we hit an argument that doesn't start with -, this is likely the image name
    if (!arg.startsWith("-")) {
      break;
    }
    
    // Skip this flag
    insertIndex++;
    
    // If this is a flag that takes a value (not a boolean flag), skip the value too
    if (insertIndex < processedArgs.length && 
        !processedArgs[insertIndex].startsWith("-") &&
        // Known boolean flags that don't take values
        !["--rm", "--interactive", "-i", "--tty", "-t", "--detach", "-d"].includes(arg)) {
      insertIndex++;
    }
  }

  console.log("[Docker] Insertion index:", insertIndex);

  // Insert environment variables as -e flags
  const envArgs: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    // Use separate -e flag for each environment variable
    envArgs.push("-e");
    envArgs.push(`${key}=${value}`);
  }

  console.log("[Docker] Environment args to insert:", envArgs);

  // Insert all environment args at once
  processedArgs.splice(insertIndex, 0, ...envArgs);

  console.log("[Docker] Final processed args:", processedArgs);

  return processedArgs;
}

/**
 * Checks if a command is a Docker command
 */
export function isDockerCommand(command: string): boolean {
  return command.toLowerCase() === "docker" || command.toLowerCase() === "docker-compose";
}
