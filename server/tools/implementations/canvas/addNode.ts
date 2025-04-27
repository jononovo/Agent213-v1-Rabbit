/**
 * Add Node Tool
 * 
 * This tool adds a specific node type to a workflow in the canvas.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const addNodeTool: Tool = {
  name: 'addNode',
  description: 'Add a specific node to the current workflow in the canvas',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to add the node to',
      },
      nodeType: {
        type: 'string',
        description: 'The type of node to add (e.g., "textInput", "httpRequest", "openAiCompletion")',
      },
      position: {
        type: 'object',
        description: 'The position of the node in the canvas (x and y coordinates)',
        properties: {
          x: {
            type: 'number',
            description: 'The x coordinate',
          },
          y: {
            type: 'number',
            description: 'The y coordinate',
          },
        },
        required: ['x', 'y'],
      },
      data: {
        type: 'object',
        description: 'Additional data to configure the node with',
      },
    },
    required: ['workflowId', 'nodeType'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, nodeType, position, data } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`,
        };
      }
      
      // Prepare the node data, ensuring it extends BaseNode
      const nodeData = data || {};
      
      // Add BaseNode metadata to ensure the node extends from BaseNode
      nodeData.isBaseExtension = true;
      nodeData.baseNodeVersion = "1.0";
      
      // Ensure handles are defined for BaseNode compatibility
      nodeData.handles = nodeData.handles || {
        input: ['input'],
        output: ['output']
      };
      
      // Add description and settings if not present
      nodeData.description = nodeData.description || `${nodeType} node - extends BaseNode`;
      nodeData.settings = nodeData.settings || {};
      nodeData.settingsData = nodeData.settingsData || {};
      
      // Create a new node
      const newNode = await storage.createNode({
        workflowId,
        name: `${nodeType}_${Date.now()}`, // Generate a name using the nodeType and timestamp
        type: nodeType,
        category: 'workflow', // Default category
        isCustom: false,
        version: '1.0.0',
        position: position || { x: 100, y: 100 }, // Default position if not provided
        data: nodeData,
        connections: [],
      });
      
      return {
        success: true,
        message: `Node ${newNode.id} (${nodeType}) added to workflow ${workflowId}`,
        data: newNode,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default addNodeTool;