import express from "express";
import { testDockerInDocker, getDockerInfo, isDockerAccessible } from "../lib/docker-support/docker-test";

const dockerTestRouter = express.Router();

/**
 * Test Docker-in-Docker functionality
 */
dockerTestRouter.get('/test', async (req, res) => {
  try {
    const isWorking = await testDockerInDocker();
    const isAccessible = await isDockerAccessible();
    const dockerInfo = await getDockerInfo();
    
    res.json({
      isWorking,
      isAccessible,
      dockerInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to test Docker functionality',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Check if Docker is accessible (lightweight check)
 */
dockerTestRouter.get('/check', async (req, res) => {
  try {
    const isAccessible = await isDockerAccessible();
    res.json({
      isAccessible,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Docker access',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get Docker daemon information
 */
dockerTestRouter.get('/info', async (req, res) => {
  try {
    const dockerInfo = await getDockerInfo();
    res.json({
      dockerInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Docker info',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default dockerTestRouter;
