/**
 * Workflow Generation Service
 *
 * This service is responsible for generating workflow definitions from natural language
 * prompts using AI models. It structures the data to be compatible with ReactFlow
 * visualization and our workflow execution engine.
 */

import { IStorage } from "../storage";
import { InsertWorkflow, Node } from "@shared/schema";
import { fetchWithTimeout } from "../utils/fetch";

/**
 * Interface for workflow generation options
 */
interface WorkflowGenerationOptions {
  apiKey?: string;
  model?: string;
  complexity?: "simple" | "moderate" | "complex";
  domain?: string;
  nodeTypes?: string[];
  maxNodes?: number;
  timeout?: number;
}

/**
 * Structure of the node types catalog
 */
interface NodeTypesCatalog {
  [key: string]: {
    type: string;
    displayName: string;
    description: string;
    category: string;
    icon: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    settings?: Record<string, any>;
  };
}

/**
 * Workflow Generation Service
 */
export class WorkflowGenerationService {
  private storage: IStorage;
  private nodeTypesCatalog: NodeTypesCatalog;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.nodeTypesCatalog = {}; // Will be populated in the init method
  }

  /**
   * Initialize the service, loading available node types
   */
  async init(): Promise<void> {
    // Retrieve all registered node types from the database
    const nodes = await this.storage.getNodes();

    // Create a catalog of node types for the AI to reference
    this.nodeTypesCatalog = nodes.reduce(
      (catalog: NodeTypesCatalog, node: Node) => {
        // Extract node configuration
        const config = (node.configuration as any) || {};

        // Add node to catalog
        catalog[node.type] = {
          type: node.type,
          displayName: node.name,
          description: node.description || "",
          category: node.category || "Other",
          icon: node.icon || "square",
          inputs: config.inputs || {},
          outputs: config.outputs || {},
          settings: config.settings || {},
        };

        return catalog;
      },
      {},
    );

    console.log(
      `Workflow Generation Service initialized with ${Object.keys(this.nodeTypesCatalog).length} node types`,
    );
  }

  /**
   * Generate a workflow definition from a natural language prompt
   */
  async generateWorkflow(
    prompt: string,
    agentId?: number,
    options: WorkflowGenerationOptions = {},
  ): Promise<any> {
    // Default options
    const {
      model = "claude-3-7-sonnet-20250219",
      complexity = "moderate",
      domain = "general",
      maxNodes = 10,
      timeout = 30000,
      apiKey,
    } = options;

    try {
      // Check if we have an API key for the LLM
      if (!apiKey && !process.env.CLAUDE_API_KEY) {
        throw new Error("No API key provided for workflow generation");
      }

      // Prepare the prompt for the LLM
      const systemPrompt = this.createSystemPrompt(
        complexity,
        domain,
        maxNodes,
      );
      const userPrompt = this.createUserPrompt(prompt);

      // Check for API key
      const apiKeyToUse = apiKey || process.env.CLAUDE_API_KEY;
      if (!apiKeyToUse) {
        throw new Error("No API key available for the Claude service");
      }

      // Call the LLM API to generate the workflow
      const response = await this.callLLMApi(
        systemPrompt,
        userPrompt,
        model,
        apiKeyToUse,
        timeout,
      );

      // Parse and validate the workflow structure
      const workflowDefinition = this.parseAndValidateWorkflow(response);

      // Add agent ID if provided
      if (agentId) {
        workflowDefinition.agentId = agentId;
      }

      // Ensure type field is set (required by the schema)
      if (!workflowDefinition.type) {
        workflowDefinition.type = "generated";
      }

      return workflowDefinition;
    } catch (error) {
      console.error("Error generating workflow:", error);
      throw error;
    }
  }

  /**
   * Create the system prompt for the LLM
   */
  private createSystemPrompt(
    complexity: string,
    domain: string,
    maxNodes: number,
  ): string {
    // Get the node types catalog as a formatted string
    const nodeTypesFormatted = Object.entries(this.nodeTypesCatalog)
      .map(([_, nodeType]) => {
        return `- ${nodeType.type} (${nodeType.category}): ${nodeType.description}`;
      })
      .join("\n");

    // Define the supported node types with clear descriptions
    const supportedNodeTypes = `
Supported Node Types (use ONLY these types):
- text_prompt: For text input, prompts, or questions a user would answer
- text_input: For collecting text input from users or systems
- generate_text: For generating text using AI models
- http_request: For making API calls to external services
- transform: For transforming data between different formats
- output: For displaying results or final output
- visualize_text: For creating visualizations of text data
- chat_interface: For creating chat-based interactions
- claude: For using the Claude AI model for generation
- database_query: For querying databases
- email_send: For sending emails
- trigger: For starting workflow processes
- processor: For processing data in various ways
- filter: For filtering data based on conditions
- response_message: For formatting response messages
- api_response_message: For formatting API responses
- workflow_trigger: For triggering other workflows
- agent_trigger: For triggering agents
`;

    // Create the system prompt
    return `You are an expert workflow designer for an AI agent system. 
Your task is to create workflow definitions that can be visualized in ReactFlow and executed by a workflow engine.

${supportedNodeTypes}

Available node types in catalog (reference only):
${nodeTypesFormatted}

Complexity level: ${complexity}
Domain focus: ${domain}
Maximum nodes: ${maxNodes}

IMPORTANT: All custom nodes should extend from the BaseNode component. Always use the BaseNode as the foundation for any new node types you create. This ensures consistent UI behavior across the system.

Your task is to:
1. Analyze the user's natural language description of a workflow
2. Identify the appropriate node types, ALWAYS using ONLY from the "Supported Node Types" list above
3. Create a coherent workflow with properly connected nodes and edges
4. Return a valid JSON workflow definition with the following structure:

{
  "name": "Workflow name",
  "description": "Workflow description",
  "flowData": {
    "nodes": [
      {
        "id": "unique-node-id",
        "type": "text_prompt", // ALWAYS use types from the Supported Node Types list
        "position": { "x": number, "y": number },
        "data": {
          "label": "Node Label",
          "description": "Node Description",
          "type": "text_prompt", // Must match the node's type field
          "category": "node-category",
          "settings": {}
        }
      }
    ],
    "edges": [
      {
        "id": "unique-edge-id",
        "source": "source-node-id",
        "sourceHandle": "output-name",
        "target": "target-node-id",
        "targetHandle": "input-name"
      }
    ]
  }
}

Ensure that:
- All nodes MUST use types from the "Supported Node Types" list (text_prompt, text_input, generate_text, http_request, etc.)
- Never use deprecated types like "prompt", "api", or "input" - instead use their proper equivalents
- All nodes are properly connected with edges
- The workflow has clear input and output nodes
- Node positions are logical (from left to right, with proper spacing)
- Response is ONLY valid JSON without any additional text or explanation
- Each node has appropriate settings based on its type`;
  }

  /**
   * Create the user prompt for the LLM
   */
  private createUserPrompt(prompt: string): string {
    return `Create a workflow based on this description: "${prompt}"`;
  }

  /**
   * Call the LLM API to generate the workflow
   */
  private async callLLMApi(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    apiKey: string,
    timeout: number,
  ): Promise<string> {
    // Use the provided API key, or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.CLAUDE_API_KEY;
    
    // Ensure we have an API key
    if (!effectiveApiKey) {
      throw new Error("No API key provided for Claude service. Please set CLAUDE_API_KEY environment variable or provide an API key in the request.");
    }
    try {
      // Prepare the request to Claude API
      const url = "https://api.anthropic.com/v1/messages";
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": effectiveApiKey,
        "anthropic-version": "2023-06-01"
      };
      
      const data = {
        model,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      };

      // Make the API request
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        },
        timeout,
      );

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} ${errorText}`);
      }

      // Parse the response
      const result = await response.json();

      // Extract and return the generated workflow
      return result.content[0].text;
    } catch (error) {
      console.error("Error calling Claude API:", error);
      throw error;
    }
  }

  /**
   * Parse and validate the workflow structure
   */
  private parseAndValidateWorkflow(responseText: string): any {
    try {
      // Extract JSON from the response
      let jsonStr = responseText.trim();

      // If the response includes markdown code blocks, extract the JSON
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
      }

      // Parse the JSON
      const workflow = JSON.parse(jsonStr);

      // Basic validation
      if (!workflow.name) throw new Error("Workflow name is required");
      if (!workflow.flowData) throw new Error("Workflow flowData is required");
      if (!workflow.flowData.nodes || !Array.isArray(workflow.flowData.nodes)) {
        throw new Error("Workflow nodes must be an array");
      }
      if (!workflow.flowData.edges || !Array.isArray(workflow.flowData.edges)) {
        throw new Error("Workflow edges must be an array");
      }

      // Map node types to the ones supported by the FlowEditor component
      // Only keeping essential mappings for standard node types
      const nodeTypeMapping: Record<string, string> = {
        transform: "transform",
        output: "output",
        database: "database_query",
        email: "email_send",
        trigger: "trigger",
        process: "processor",
        filter: "filter",
      };

      // Update node types and positions in the workflow
      if (workflow.flowData.nodes) {
        // Ensure all nodes are nicely positioned in the top-left of the canvas
        // This makes them immediately visible to users
        const baseX = 100; // Start X position
        const baseY = 100; // Start Y position
        const nodeWidth = 250; // Average node width
        const nodePadding = 50; // Padding between nodes
        const nodesPerRow = 3; // Nodes per row before wrapping to a new row

        workflow.flowData.nodes = workflow.flowData.nodes.map(
          (node: any, index: number) => {
            // Check if this node type needs to be mapped
            if (node.type && nodeTypeMapping[node.type]) {
              node.type = nodeTypeMapping[node.type];
            }

            // Also update the type in the data object if it exists
            if (
              node.data &&
              node.data.type &&
              nodeTypeMapping[node.data.type]
            ) {
              node.data.type = nodeTypeMapping[node.data.type];
            }

            // Calculate grid position
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;

            // Position nodes in a grid layout, starting from top-left
            node.position = {
              x: baseX + col * (nodeWidth + nodePadding),
              y: baseY + row * 200, // 200px vertical spacing between rows
            };

            // Ensure every node has a unique ID
            if (!node.id) {
              node.id = `${node.type || "node"}-${Date.now()}-${index}`;
            }

            // Make sure data has label and category
            if (!node.data) {
              node.data = {};
            }

            if (!node.data.label) {
              node.data.label = node.type
                ? `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node`
                : "Node";
            }

            if (!node.data.category) {
              node.data.category = this.getCategoryForNodeType(node.type);
            }
            
            // Ensure node extends from BaseNode by adding the appropriate metadata
            this.ensureNodeExtendsBaseNode(node);

            return node;
          },
        );
      }

      // Convert to string for storage
      workflow.flowData = JSON.stringify(workflow.flowData);

      return workflow;
    } catch (error) {
      console.error("Error parsing workflow JSON:", error);
      throw new Error(
        `Failed to parse workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the appropriate category for a node type
   * 
   * Note: This method is simplified to use default categories since node types
   * now define their own categories in the client-side folder structure
   */
  private getCategoryForNodeType(type: string | undefined): string {
    if (!type) return "default";
    
    // Simple mapping for common types - in production, this should be
    // retrieved from client-side node definitions
    const defaultCategories: Record<string, string> = {
      "text_input": "Input",
      "claude": "AI",
      "http_request": "API"
    };
    
    return defaultCategories[type] || "default";
  }
  
  /**
   * Ensure that a node extends the BaseNode component by adding required metadata
   * This helps with consistency and ensures that all nodes have the necessary properties
   * to work with the BaseNode wrapper component
   */
  private ensureNodeExtendsBaseNode(node: any): void {
    if (!node.data) {
      node.data = {};
    }
    
    // Ensure the node has basic properties to work with BaseNode
    node.data.baseNodeVersion = "1.0"; // Add a version to track BaseNode compatibility
    
    // Add standard BaseNode properties if they don't exist
    if (!node.data.description) {
      node.data.description = `${node.data.label || 'Node'} - extends BaseNode`;
    }
    
    // Ensure settings object exists
    if (!node.data.settings) {
      node.data.settings = {};
    }
    
    // Initialize settingsData if missing (used by BaseNode UI)
    if (!node.data.settingsData) {
      node.data.settingsData = {};
    }
    
    // Add isBaseExtension flag to indicate this node uses BaseNode
    node.data.isBaseExtension = true;
    
    // Add standard handles for input/output that BaseNode expects
    node.data.handles = node.data.handles || {
      input: ['input'],
      output: ['output']
    };
    
    console.log(`Ensured node ${node.id} extends BaseNode`);
  }

  /**
   * Create a new workflow in the database
   */
  async createWorkflow(workflowData: InsertWorkflow): Promise<any> {
    try {
      // Create the workflow in the database
      const workflow = await this.storage.createWorkflow(workflowData);

      return workflow;
    } catch (error) {
      console.error("Error creating workflow:", error);
      throw error;
    }
  }
}

// Import storage
import { storage } from "../storage";

// Export a function to create the service
export function createWorkflowGenerationService(
  storage: IStorage,
): WorkflowGenerationService {
  const service = new WorkflowGenerationService(storage);
  service.init().catch((error) => {
    console.error("Error initializing workflow generation service:", error);
  });
  return service;
}

// Create and export the default instance
export const workflowGenerationService =
  createWorkflowGenerationService(storage);
