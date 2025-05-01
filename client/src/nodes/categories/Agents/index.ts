/**
 * Agent Nodes
 * 
 * This module exports all agent nodes that interact with AI agents
 * and LLMs for workflow automation.
 */

// Export agent_trigger node
export { default as agent_trigger } from './agent_trigger/definition';

// Export the node types from this category
export const AGENTS_NODE_TYPES: string[] = [
  'agent_trigger'
];

// Export executor for agent_trigger
export { executor as agent_trigger_executor } from './agent_trigger/executor';