/**
 * Node Data Access Service
 * 
 * This service provides standardized access to shared data sources
 * that may be required by multiple node types.
 * 
 * These utilities provide a clean way for nodes to declare their data
 * requirements without duplicating API access code.
 */

import { useQuery } from '@tanstack/react-query';
import { Agent, Workflow } from '@shared/schema';

/**
 * Fetch all workflows from the API
 * 
 * @param enabled Whether the query should be enabled
 * @returns Query result with workflows data
 */
export function useWorkflows(enabled = true) {
  return useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled
  });
}

/**
 * Fetch all agents from the API
 * 
 * @param enabled Whether the query should be enabled
 * @returns Query result with agents data
 */
export function useAgents(enabled = true) {
  return useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled
  });
}

/**
 * Format workflows as options for a dropdown
 * 
 * @param workflows Array of workflow objects
 * @returns Array of { value, label } options
 */
export function formatWorkflowOptions(workflows: Workflow[]) {
  if (!workflows || !Array.isArray(workflows)) return [];
  
  return workflows.map(workflow => ({
    value: workflow.id.toString(),
    label: workflow.name
  }));
}

/**
 * Format agents as options for a dropdown
 * 
 * @param agents Array of agent objects
 * @returns Array of { value, label } options
 */
export function formatAgentOptions(agents: Agent[]) {
  if (!agents || !Array.isArray(agents)) return [];
  
  return agents.map(agent => ({
    value: agent.id.toString(),
    label: agent.name
  }));
}