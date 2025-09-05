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

  const processedArgs = [...args];
  const runIndex = processedArgs.indexOf("run");
  
  if (runIndex === -1) {
    return processedArgs;
  }

  // Insert environment variables as -e flags after 'run' and before image name
  let insertIndex = runIndex + 1;
  
  // Skip existing flags to find the right insertion point
  while (insertIndex < processedArgs.length && processedArgs[insertIndex].startsWith("-")) {
    insertIndex++;
    // Skip the value if this flag takes one
    if (insertIndex < processedArgs.length && !processedArgs[insertIndex].startsWith("-")) {
      insertIndex++;
    }
  }

  // Insert environment variables
  for (const [key, value] of Object.entries(env)) {
    processedArgs.splice(insertIndex, 0, "-e", `${key}=${value}`);
    insertIndex += 2;
  }

  return processedArgs;
}

/**
 * Checks if a command is a Docker command
 */
export function isDockerCommand(command: string): boolean {
  return command.toLowerCase() === "docker" || command.toLowerCase() === "docker-compose";
}
