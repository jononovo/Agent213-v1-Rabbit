/**
 * Agent Coordinator Service
 * 
 * This service coordinates the interaction between user inputs and the appropriate tools.
 * It uses OpenAI's function calling to determine which tools to execute.
 */
import OpenAI from 'openai';
import { toolRegistry } from '../tools/registry';
import { storage } from '../storage';
import { InsertLog } from '../../shared/schema';

interface ProcessOptions {
  context?: string;
  agentId?: number;
  userId?: number;
  sessionId?: string;
}

/**
 * Agent Coordinator class
 */
export class AgentCoordinator {
  private openai: OpenAI;
  private model: string;
  
  /**
   * Create a new agent coordinator
   * @param apiKey OpenAI API key
   */
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    
    // Use GPT-4 if available, otherwise fall back to GPT-3.5-turbo
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }
  
  /**
   * Process a user input message and determine what action to take
   * @param input User input message
   * @param options Processing options
   * @returns Processing result
   */
  async processUserInput(
    input: string, 
    options: ProcessOptions = {}
  ): Promise<{
    response: string;
    action?: string;
    toolName?: string;
    toolParams?: any;
    toolResult?: any;
  }> {
    try {
      const { context = 'default', agentId, userId, sessionId } = options;
      
      // Log the incoming message
      const logEntry: InsertLog = {
        agentId: agentId || undefined,
        status: 'info',
        input: { message: input },
        output: {},
        executionPath: {
          source: 'agent_coordinator',
          messageType: 'user_message',
          userId,
          sessionId
        }
      };
      
      await storage.createLog(logEntry);
      
      // Get available tools for this context
      const tools = toolRegistry.getToolsAsOpenAIFunctions(context);
      
      if (tools.length === 0) {
        return {
          response: "I'm sorry, but there are no tools available for me to help with your request."
        };
      }
      
      // Create the system prompt
      const systemPrompt = `You are an AI assistant that helps users with workflow automation tasks.
Your job is to understand what the user wants and use the appropriate tools to help them.
When users ask questions, answer directly if you can. If they want you to perform an action, use the available tools.
Always be helpful, clear, and concise in your responses.
Provide suggestions when the user's request is unclear, and once they confirm, take action and report back what you did.

IMPORTANT: When creating or modifying workflow nodes, ALWAYS use the BaseNode component as the foundation. 
All custom nodes should extend from BaseNode to ensure consistent behavior and UI rendering across the system.
This is a critical requirement for all node creation and modification operations.`;
      
      // First, ask the model what to do
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        functions: tools,
        function_call: 'auto',
      });
      
      const message = response.choices[0].message;
      
      // If the model chose to call a function
      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionParams = JSON.parse(message.function_call.arguments);
        
        // Look up the tool and execute it
        const tool = toolRegistry.getTool(functionName);
        
        if (!tool) {
          return {
            response: `I tried to use the ${functionName} tool, but it seems unavailable. Please try again with a different request.`
          };
        }
        
        // Execute the tool
        const result = await tool.execute(functionParams);
        
        // Log the tool execution
        const toolLogEntry: InsertLog = {
          agentId: agentId || undefined,
          status: result.success ? 'success' : 'error',
          input: functionParams,
          output: result,
          error: result.success ? null : (result.error || 'Tool execution failed'),
          executionPath: {
            source: 'agent_coordinator',
            operation: `Tool ${functionName} execution: ${result.success ? 'success' : 'failed'}`,
            messageType: 'tool_execution',
            level: result.success ? 'info' : 'error',
            userId,
            sessionId,
            toolName: functionName
          }
        };
        
        await storage.createLog(toolLogEntry);
        
        // Generate a response based on the tool execution
        const secondResponse = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
            { 
              role: 'function', 
              name: functionName, 
              content: JSON.stringify(result)
            },
            { 
              role: 'system', 
              content: `The ${functionName} tool was executed. Please respond to the user with the results in a natural, conversational way.`
            }
          ],
        });
        
        return {
          response: secondResponse.choices[0].message.content || "I've completed your request.",
          action: 'tool_execution',
          toolName: functionName,
          toolParams: functionParams,
          toolResult: result
        };
      }
      
      // If the model chose to respond directly
      return {
        response: message.content || "I'm not sure how to respond to that. Could you rephrase your request?"
      };
      
    } catch (error) {
      console.error('Error in agent coordinator:', error);
      return {
        response: "I'm sorry, but I encountered an error processing your request. Please try again later.",
        action: 'error',
        toolResult: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

/**
 * Create a new agent coordinator
 * @param apiKey OpenAI API key
 * @returns A new agent coordinator instance
 */
export function createAgentCoordinator(apiKey: string): AgentCoordinator {
  return new AgentCoordinator(apiKey);
}