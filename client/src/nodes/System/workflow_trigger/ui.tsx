/**
 * Embed Other Workflow Node UI Component
 * 
 * UI component for the workflow trigger node with settings drawer integration.
 * This node allows embedding and running another workflow within the current workflow.
 */

import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the node data interface
export interface WorkflowTriggerNodeData {
  workflowId?: number | string | null;
  inputField?: string;
  timeout?: number;
  waitForCompletion?: boolean;
  settings?: any;
}

// Default data for the node
export const defaultData: WorkflowTriggerNodeData = {
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true
};

// Validator function for node data
export const validator = (data: WorkflowTriggerNodeData) => {
  const errors: string[] = [];
  
  if (!data.workflowId) {
    errors.push('Workflow ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// UI component for the Workflow Trigger node
export const component = React.memo(function WorkflowTriggerNode({ 
  id, 
  data,
  selected,
  isConnectable = true 
}: NodeProps<WorkflowTriggerNodeData>) {
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  
  // Combine default data with provided data for local rendering
  const nodeData = {
    ...defaultData,
    ...data
  };
  
  // Debug info
  console.log(`Rendering workflow_trigger node with data:`, nodeData);
  
  // Load available workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (response.ok) {
          const workflowData = await response.json();
          setAvailableWorkflows(Array.isArray(workflowData) ? workflowData : []);
        } else {
          console.error('Failed to fetch workflows');
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Handle settings click
  const handleSettingsClick = () => {
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Register with settings drawer
  useEffect(() => {
    // Skip if no onChange or if we don't have workflow options yet
    if (typeof (data as any).onChange !== 'function' || !availableWorkflows.length) {
      return;
    }
    
    // Define the settings for the global settings drawer
    const settings = {
      title: 'Embed Other Workflow Settings',
      fields: [
        {
          key: 'workflowId',
          label: 'Workflow',
          type: 'select',
          description: 'Select the workflow to trigger',
          options: availableWorkflows.map(wf => ({
            value: wf.id.toString(),
            label: wf.name
          }))
        },
        {
          key: 'inputField',
          label: 'Input Field',
          type: 'select',
          description: 'Select which field to pass as input',
          options: [
            { value: 'json', label: 'JSON (entire object)' },
            { value: 'text', label: 'Text content' },
            { value: 'content', label: 'Content field' }
          ]
        },
        {
          key: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          description: 'Maximum time to wait for workflow execution (in milliseconds)',
          min: 0,
          max: 120000,
          step: 1000
        },
        {
          key: 'waitForCompletion',
          label: 'Wait for Completion',
          type: 'checkbox',
          description: 'Wait for the workflow to complete before continuing'
        }
      ]
    };
    
    // Add the settings to the node data using onChange
    (data as any).onChange({
      ...data,
      settings,
      label: "Embed Other Workflow",
      description: "Runs another workflow from within this workflow"
    });
  }, [id, data, availableWorkflows]);
  
  // Get selected workflow name for display
  const getSelectedWorkflowName = () => {
    // First check the direct workflowId property (might be already set)
    const workflowId = nodeData.workflowId || 
                      (nodeData.settings && nodeData.settings.workflowId);
                      
    if (!workflowId) return 'None selected';
    
    // Convert workflowId to string for comparison
    const workflowIdStr = String(workflowId);
    
    // Find the workflow in available workflows
    const workflow = availableWorkflows.find(wf => String(wf.id) === workflowIdStr);
    return workflow ? workflow.name : `ID: ${workflowId}`;
  };
  
  // Check if the node is configured
  const isConfigured = Boolean(nodeData.workflowId || 
                    (nodeData.settings && nodeData.settings.workflowId));

  return (
    <>
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input"
        isConnectable={isConnectable}
        style={{ 
          top: '-6px', 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #6366f1'
        }}
      />

      {/* Main node container */}
      <div className={cn(
        "workflow-trigger-node rounded-lg border shadow-sm min-w-[240px] max-w-[320px]",
        selected ? "ring-2 ring-primary" : "",
        (data as any)._hasError ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
      )}>
        {/* Node header */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-500/10 to-slate-100/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-1.5 rounded-md bg-slate-100 text-slate-700 mr-2">
              <GitBranch className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-medium truncate text-slate-700">Embed Other Workflow</h3>
          </div>
          <div className="flex items-center gap-2">
            {!isConfigured && (
              <div className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-0.5 rounded-full border">
                Needs Config
              </div>
            )}
            <button
              onClick={handleSettingsClick}
              className="h-6 w-6 rounded hover:bg-slate-100 flex items-center justify-center"
              title="Settings"
            >
              <Settings size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Node content */}
        <div className="p-3 text-sm">
          {isConfigured ? (
            <div className="text-slate-700">
              <p className="text-lg font-medium text-slate-800">
                Workflow: {getSelectedWorkflowName()}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Input Field: {nodeData.inputField || 'json'}
              </p>
              {nodeData.waitForCompletion === false && (
                <p className="text-xs text-slate-500 mt-1">
                  Runs asynchronously
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <AlertCircle size={14} className="mr-1" />
              <span className="text-xs">Click Settings to configure workflow</span>
            </div>
          )}

          {(data as any)._hasError && (data as any)._errorMessage && (
            <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
              Error: {(data as any)._errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output"
        isConnectable={isConnectable}
        style={{ 
          bottom: '-6px', 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #10b981'
        }}
      />
    </>
  );
});