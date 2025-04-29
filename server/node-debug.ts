/**
 * Node Debug API Handler
 * 
 * This module provides functionality to debug nodes by executing them
 * with sample inputs in isolation.
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { storage } from './storage';

/**
 * Process a node debug request
 * 
 * This function handles executing a node type with sample inputs
 * for testing and debugging purposes
 */
export async function handleNodeDebugRequest(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body with the nodeType and data
    const reqSchema = z.object({
      nodeType: z.string(),
      data: z.record(z.any()).default({}),
      inputs: z.record(z.any()).default({})
    });
    
    const validation = reqSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        message: "Invalid debug request",
        details: fromZodError(validation.error).message
      });
      return;
    }
    
    const { nodeType, data, inputs } = validation.data;
    
    // Define the log variable in the outer scope
    let debugAttemptLog: { id: number; executionPath: Record<string, any> };
    
    try {
      // Determine node category
      let category = 'Custom';
      const categoryMap: Record<string, string> = {
        'claude': 'System',
        'function_node': 'System',
        'webhook_trigger': 'Integration',
        'perplexity_api': 'Integration',
        'embed_other_workflow': 'System',
        'send_to_webhook': 'System'
      };
      
      category = categoryMap[nodeType] || 'Custom';
      
      // Log the debug attempt first to help with tracking
      debugAttemptLog = await storage.createLog({
        workflowId: undefined,
        agentId: undefined,
        status: 'node_debug_attempt',
        input: { nodeType, data, inputs },
        output: {},
        error: null,
        executionPath: {
          debug: true,
          nodeType,
          category,
          timestamp: new Date().toISOString()
        }
      });
      
      // Attempt to dynamically import the node executor
      const nodePath = `../client/src/nodes/${category}/${nodeType}/executor`;
      console.log(`[Node Debug] Attempting to load executor from ${nodePath}`);
      
      const { execute } = await import(nodePath);
      if (typeof execute !== 'function') {
        throw new Error(`Node type ${nodeType} does not have a valid executor function`);
      }
      
      // Execute the node
      const result = await execute(data, inputs);
      
      // Update the log with success results
      await storage.updateLog(debugAttemptLog.id, {
        status: 'node_debug_success',
        output: { result },
        executionPath: {
          ...debugAttemptLog.executionPath,
          success: true,
          completedAt: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error(`[Node Debug] Error executing node ${nodeType}:`, error);
      
      // Create a detailed error log to help with debugging
      if (typeof debugAttemptLog !== 'undefined') {
        await storage.updateLog(debugAttemptLog.id, {
          status: 'node_debug_failed',
          error: error instanceof Error ? error.message : String(error),
          executionPath: {
            ...debugAttemptLog.executionPath,
            success: false,
            error: error instanceof Error ? error.stack : String(error),
            completedAt: new Date().toISOString()
          }
        });
      }
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error('[Node Debug] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get the node category from its type
 */
export function getNodeCategory(nodeType: string): string {
  // Common mappings between node types and their categories
  const categoryMap: Record<string, string> = {
    'claude': 'System',
    'function_node': 'System',
    'webhook_trigger': 'Integration',
    'perplexity_api': 'Integration',
    'embed_other_workflow': 'System',
    'send_to_webhook': 'System'
  };
  
  return categoryMap[nodeType] || 'Custom';
}