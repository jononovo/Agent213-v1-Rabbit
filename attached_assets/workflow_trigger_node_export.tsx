/**
 * Workflow Trigger Node - Complete Implementation
 * 
 * This file contains the complete implementation of the workflow_trigger node
 * including definition, UI component, and executor logic.
 * 
 * Usage: Extract the components and place them in the appropriate files
 * in your target system.
 */

// ==================================================================================
// FILE: definition.ts
// ==================================================================================

/**
 * Workflow Trigger Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

const definition = {
  type: 'workflow_trigger',
  name: 'Workflow Trigger',
  description: 'Triggers another workflow from within a workflow, allowing for modular workflow design',
  category: 'actions',
  version: '1.0.0',
  icon: 'git-branch',  // Use string icon identifier instead of React component
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to pass to the triggered workflow'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Output data received from the triggered workflow'
    },
    error: {
      type: 'string',
      description: 'Error message if workflow execution failed'
    }
  },
  // We'll use custom UI for workflow selection instead of simple configOptions
  defaultData: {
    workflowId: null,
    inputField: 'json',
    timeout: 30000,
    waitForCompletion: true
  }
};

// ==================================================================================
// FILE: executor.ts
// ==================================================================================

/**
 * Workflow Trigger Node Executor
 * 
 * Handles the execution logic for the Workflow Trigger node,
 * managing API calls to trigger other workflows and process their results.
 */

// Import types for the node executor
interface NodeExecutionData {
  items: {
    json: Record<string, any>;
    text?: string;
    [key: string]: any;
  }[];
  meta: {
    startTime: Date;
    endTime: Date;
    [key: string]: any;
  };
}

// Helper function to make API requests
async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'same-origin'
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    // Return text if not valid JSON
    return await response.text();
  }
}

/**
 * The main executor function for the workflow trigger node
 * 
 * This function is called when the node is executed in a workflow
 * It manages the process of:
 * 1. Extracting input data from connected nodes
 * 2. Calling the target workflow
 * 3. Handling timeouts and errors
 * 4. Returning results to continue the workflow
 */
const executor = async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData>
): Promise<NodeExecutionData> {
  console.log('Workflow Trigger Node - Starting execution', nodeData);
  
  const startTime = new Date();
  
  try {
    // Extract configuration from node data
    const workflowId = nodeData.workflowId;
    const inputField = nodeData.inputField || 'json';
    const timeout = nodeData.timeout || 30000;
    const waitForCompletion = nodeData.waitForCompletion !== false; // Default to true
    
    // Validate workflow ID
    if (!workflowId) {
      throw new Error('Missing workflow ID in configuration');
    }
    
    // Extract input data from connected nodes
    let inputData: any = null;
    
    if (inputs && Object.keys(inputs).length > 0) {
      const firstInput = Object.values(inputs)[0];
      if (firstInput?.items?.length > 0) {
        const item = firstInput.items[0];
        
        // Get data based on specified input field
        if (inputField === 'json' && item.json) {
          inputData = item.json;
        } else if (inputField === 'text' && item.json?.text) {
          inputData = item.json.text;
        } else if (inputField === 'content' && item.json?.content) {
          inputData = item.json.content;
        } else {
          // Default fallback - use whatever we can get
          inputData = item.json || item.text || item;
        }
      }
    }
    
    // Execute the workflow via API
    console.log(`Triggering workflow ${workflowId} with input:`, inputData);
    
    // Create a promise for the API call
    const responsePromise = apiRequest(`/workflows/${workflowId}/execute`, 'POST', {
      input: inputData,
      metadata: {
        source: 'workflow_trigger',
        parentNodeId: nodeData.id || 'unknown',
        waitForCompletion
      }
    });
    
    // Handle timeout if configured
    let response;
    if (timeout > 0) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Workflow execution timed out after ${timeout}ms`)), timeout);
      });
      
      response = await Promise.race([responsePromise, timeoutPromise]);
    } else {
      response = await responsePromise;
    }
    
    console.log(`Workflow ${workflowId} execution completed:`, response);
    
    // Format the response as a workflow item for output
    const outputItem = {
      json: response?.data || response,
      text: typeof response?.data === 'string' ? response.data : JSON.stringify(response)
    };
    
    return {
      items: [outputItem],
      meta: {
        startTime,
        endTime: new Date(),
        workflowId: workflowId,
        executionId: response?.executionId || 'unknown',
        waitedForCompletion: waitForCompletion
      }
    };
  } catch (error: any) {
    console.error('Workflow Trigger Node - Execution error:', error);
    
    // Return an error result that can be handled downstream
    return {
      items: [{
        json: { 
          error: error.message || 'Unknown error', 
          details: error.response?.data || error.stack
        },
        text: `Error: ${error.message || 'Unknown error'}`
      }],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        errorMessage: error.message || 'Unknown error'
      }
    };
  }
};

// ==================================================================================
// FILE: ui.tsx
// ==================================================================================

/**
 * Simple Workflow Trigger Node UI Component
 * 
 * A simplified version that uses basic UI elements to avoid SelectItem issues
 * 
 * Dependencies:
 * - React
 * - react-flow (for Handle, Position)
 * - lucide-react (for icons)
 */

/*
import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
*/

// Simplified interface that focuses on node props
interface WorkflowTriggerProps {
  id: string;
  data: any;
  selected: boolean;
  isConnectable?: boolean;
}

// Main component for the workflow trigger node
const component = function({ 
  id, 
  data, 
  selected,
  isConnectable = true 
}: WorkflowTriggerProps) {
  // State for UI
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [availableWorkflows, setAvailableWorkflows] = React.useState<any[]>([]);
  
  // Node settings - local state to manage changes before saving
  const [workflowId, setWorkflowId] = React.useState<string>(
    data.workflowId ? data.workflowId.toString() : ""
  );
  const [inputField, setInputField] = React.useState<string>(data.inputField || 'json');
  const [timeout, setTimeout] = React.useState<string>(
    (data.timeout || 30000).toString()
  );
  const [waitForCompletion, setWaitForCompletion] = React.useState<boolean>(
    data.waitForCompletion !== undefined ? data.waitForCompletion : true
  );
  
  // Load available workflows
  React.useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (response.ok) {
          const data = await response.json();
          setAvailableWorkflows(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch workflows');
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Update configuration status based on workflowId
  React.useEffect(() => {
    setIsConfigured(!!data.workflowId);
  }, [data.workflowId]);
  
  // Save settings back to node data
  const saveSettings = () => {
    // Create updated data object
    const updatedData = {
      ...data,
      workflowId: workflowId ? parseInt(workflowId, 10) : null,
      inputField,
      timeout: parseInt(timeout, 10),
      waitForCompletion
    };
    
    // Dispatch custom event for the workflow editor to handle
    const updateEvent = new CustomEvent('node-data-update', {
      detail: {
        nodeId: id,
        data: updatedData
      }
    });
    window.dispatchEvent(updateEvent);
    
    setIsSettingsOpen(false);
  };
  
  // Toggle settings panel open/closed
  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  // Get selected workflow name for display
  const getSelectedWorkflowName = () => {
    if (!data.workflowId) return 'None selected';
    const workflow = availableWorkflows.find(w => w.id === data.workflowId);
    return workflow ? workflow.name : `ID: ${data.workflowId}`;
  };

  return (
    <>
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />

      {/* Main node container */}
      <div className={cn(
        "workflow-trigger-node rounded-lg border shadow-sm min-w-[240px] max-w-[320px]",
        selected ? "ring-2 ring-blue-500" : "",
        data._hasError ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
      )}>
        {/* Node header */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-2">
              <GitBranch size={12} />
            </div>
            <span className="font-medium text-sm">
              {data.label || 'Workflow Trigger'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isConfigured && (
              <div className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-0.5 rounded-full border">
                Needs Config
              </div>
            )}
            <button
              onClick={handleSettingsClick}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100"
              title="Settings"
            >
              <Settings size={12} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Node content - either settings form or status display */}
        {isSettingsOpen ? (
          <div className="p-3 text-sm">
            <h3 className="font-medium mb-3">Workflow Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium">Select Workflow</label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                >
                  <option value="">-- Select a workflow --</option>
                  {availableWorkflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium">Input Field</label>
                <select
                  value={inputField}
                  onChange={(e) => setInputField(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                >
                  <option value="json">JSON (entire object)</option>
                  <option value="text">Text content</option>
                  <option value="content">Content field</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium">Timeout (ms)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Wait for completion</label>
                <input
                  type="checkbox"
                  checked={waitForCompletion}
                  onChange={(e) => setWaitForCompletion(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1 text-xs rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 text-sm">
            {isConfigured ? (
              <div className="text-slate-700">
                <p className="flex items-center">
                  <span className="font-medium">Workflow:</span>
                  <span className="ml-1">{getSelectedWorkflowName()}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Input Field: {data.inputField || 'json'}
                </p>
                {data.waitForCompletion === false && (
                  <p className="text-xs text-slate-500">
                    Runs asynchronously
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <AlertCircle size={14} className="mr-1" />
                <span>Click Settings to configure workflow</span>
              </div>
            )}

            {data._hasError && data._errorMessage && (
              <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
                Error: {data._errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />
    </>
  );
};

// ==================================================================================
// FILE: index.ts
// ==================================================================================

/**
 * Workflow Trigger Node
 * 
 * Entry point for the workflow_trigger node that allows running one workflow from within another.
 * Exports the node definition, UI component, and executor.
 */

/*
import definition from './definition';
import component from './ui';
import executor from './executor';

export {
  definition,
  component,
  executor
};
*/

// ==================================================================================
// FLOW EDITOR EVENT HANDLING CODE
// ==================================================================================

/**
 * Add this event listener to your FlowEditor component to handle node-data-update events
 * This is critical for the workflow_trigger node to save its settings
 * 
 * Example placement: Inside the FlowEditor component or its effect hook
 */

/*
// In your FlowEditor.tsx file
useEffect(() => {
  // Add event listener for node data updates
  const handleNodeDataUpdate = (event: CustomEvent) => {
    const { nodeId, data } = event.detail;
    
    // Update the node data in the workflow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      })
    );
    
    // Save the workflow after node data update
    saveWorkflow();
  };
  
  // Add event listener
  window.addEventListener('node-data-update', handleNodeDataUpdate as EventListener);
  
  // Cleanup
  return () => {
    window.removeEventListener('node-data-update', handleNodeDataUpdate as EventListener);
  };
}, []);
*/