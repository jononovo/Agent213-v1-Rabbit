/**
 * Embed Workflow Node UI Component
 * 
 * This node allows users to embed and run another workflow within their current workflow.
 * It uses BaseNode as a wrapper to ensure consistent hover menu behavior,
 * while preserving custom functionality.
 */

import React, { useState, useEffect, memo } from 'react';
import { NodeProps } from 'reactflow';
import { GitBranch, AlertCircle } from 'lucide-react';

import { BaseNode } from '@/nodes/core/base';
import { createSettingsAction, createDuplicateAction, createDeleteAction } from '@/nodes/components/base';

// Node interface
interface EmbedWorkflowNodeData {
  label: string;
  description?: string;
  workflowId?: number | string | null;
  inputField?: string;
  timeout?: number;
  waitForCompletion?: boolean;
  onChange?: (data: any) => void;
  settings?: Record<string, any>;
  category?: string;
  icon?: string | React.ReactNode;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  [key: string]: any;
}

// Default data for the node
export const defaultData: EmbedWorkflowNodeData = {
  label: 'Embed Workflow',
  description: 'Run another workflow from within this workflow',
  category: 'actions',
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true
};

/**
 * EmbedWorkflowNode component that uses BaseNode wrapper
 */
function EmbedWorkflowNode({ 
  data, 
  id, 
  selected, 
  isConnectable = true 
}: NodeProps<EmbedWorkflowNodeData>) {
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
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
  
  // Register with settings drawer
  useEffect(() => {
    if (typeof nodeData.onChange === 'function' && availableWorkflows.length) {
      // Define settings for the global settings drawer
      const settings = {
        title: 'Embed Workflow Settings',
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
      nodeData.onChange({
        ...data,
        settings,
        label: "Embed Workflow",
        description: "Run another workflow from within this workflow",
        useGlobalSettingsOnly: true, // Use only global settings drawer
        icon: nodeData.icon || 'git-branch'
      });
    }
  }, [id, data, availableWorkflows, nodeData.onChange]);
  
  // Get selected workflow name for display
  const getSelectedWorkflowName = () => {
    // First check the direct workflowId property
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
  
  // Create custom content for the node
  const customContent = (
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

      {nodeData._hasError && nodeData._errorMessage && (
        <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
          Error: {nodeData._errorMessage}
        </div>
      )}
    </div>
  );

  // Create icon element for the header
  const iconElement = (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-1.5 rounded-md shadow-sm border border-slate-300">
      <GitBranch className="h-4 w-4 text-slate-700" />
    </div>
  );
  
  // Return the BaseNode-wrapped component
  return (
    <BaseNode
      id={id}
      data={{
        ...nodeData,
        icon: iconElement,
        childrenContent: customContent,
        isSourceNode: false,
        hideDefaultHandles: false
      }}
      selected={selected}
      isConnectable={isConnectable}
      type="embed_other_workflow_new"
    />
  );
}

// Export component with memo for optimization
export default memo(EmbedWorkflowNode);