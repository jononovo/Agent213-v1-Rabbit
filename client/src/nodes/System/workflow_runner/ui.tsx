/**
 * Workflow Runner Node UI Component
 * 
 * This component renders a custom implementation of the Workflow Runner node
 * with settings drawer integration and hover menu support.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Settings, ArrowRight, Activity } from 'lucide-react';
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NodeValidationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { WorkflowRunnerNodeData, defaultData } from './executor';

import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction,
  createAddNoteAction, 
  NodeHoverMenuAction
} from '@/components/nodes/common/NodeHoverMenu';

// Re-export defaultData from executor
export { defaultData } from './executor';

// Validator function for node data
const validator = (data: WorkflowRunnerNodeData): NodeValidationResult => {
  const errors: string[] = [];
  
  if (!data.workflowId) {
    errors.push('Workflow ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Export validator for use in other components
export { validator };

// UI component for the Workflow Runner node
export const component = function WorkflowRunnerNode({ data, id, selected, isConnectable }: NodeProps<WorkflowRunnerNodeData>) {
  // Store the merged data in state so we can update it when props change
  const [nodeData, setNodeData] = useState(() => ({ ...defaultData, ...data }));
  const [workflowName, setWorkflowName] = useState<string>('');
  
  // Update nodeData when props change
  useEffect(() => {
    setNodeData({ ...defaultData, ...data });
  }, [data]);

  // Fetch workflow name when workflowId changes
  useEffect(() => {
    const fetchWorkflowName = async () => {
      if (nodeData.workflowId) {
        try {
          const response = await fetch(`/api/workflows/${nodeData.workflowId}`);
          if (response.ok) {
            const workflow = await response.json();
            setWorkflowName(workflow.name || 'Unknown workflow');
          } else {
            setWorkflowName('Unknown workflow');
          }
        } catch (error) {
          console.error('Error fetching workflow details:', error);
          setWorkflowName('Unknown workflow');
        }
      } else {
        setWorkflowName('No workflow selected');
      }
    };
    
    fetchWorkflowName();
  }, [nodeData.workflowId]);
  
  // Hover menu state
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hideDelay = 400; // ms before hiding menu
  
  // Register with settings drawer
  useEffect(() => {
    // Define the settings for the global settings drawer
    const settings = {
      title: 'Workflow Runner Settings',
      fields: [
        {
          key: 'workflowId',
          label: 'Workflow',
          type: 'workflow_select',
          description: 'Select workflow to run'
        },
        {
          key: 'waitForResult',
          label: 'Wait for Result',
          type: 'select',
          description: 'Wait for the workflow to complete',
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        },
        {
          key: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          description: 'Maximum wait time in milliseconds',
          min: 1000,
          max: 300000,
          step: 1000
        },
        {
          key: 'inputMapping',
          label: 'Input Mapping',
          type: 'json',
          description: 'Map input keys to workflow input keys'
        }
      ]
    };
    
    // Add the settings to the node data using onChange
    if (typeof (data as any).onChange === 'function') {
      (data as any).onChange({
        ...data,
        settings,
        label: "Workflow Runner",
        description: "Runs another workflow within the current workflow"
      });
    }
  }, [id, data]);
  
  // Handle node action from hover menu
  const handleSettingsClick = useCallback(() => {
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  }, [id]);
  
  const handleRunNode = useCallback(() => {
    if ((data as any).onRun) {
      (data as any).onRun(id);
    } else {
      const event = new CustomEvent('node-run', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleDuplicateNode = useCallback(() => {
    if ((data as any).onDuplicate) {
      (data as any).onDuplicate(id);
    } else {
      const event = new CustomEvent('node-duplicate', { 
        detail: { 
          nodeId: id,
          nodeType: 'workflow_runner',
          nodeData: data 
        }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleDeleteNode = useCallback(() => {
    if ((data as any).onDelete) {
      (data as any).onDelete(id);
    } else {
      const event = new CustomEvent('node-delete', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleEditNote = useCallback(() => {
    const event = new CustomEvent('node-note-edit', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  }, [id]);
  
  // Function to handle hover start
  const handleHoverStart = useCallback(() => {
    // Set a timeout to show the menu after hovering for specified delay
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, hoverDelay);
    
    setHoverTimer(timer);
  }, [hoverDelay]);
  
  // Function to handle hover end
  const handleHoverEnd = useCallback(() => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Add a delay before hiding the menu to give users time to move to it
    const timer = setTimeout(() => {
      setShowHoverMenu(false);
    }, hideDelay);
    
    setHoverTimer(timer);
  }, [hoverTimer, hideDelay]);
  
  // Handle menu hovering to keep it visible when cursor moves from node to menu
  const handleMenuHoverStart = useCallback(() => {
    setShowHoverMenu(true);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Create hover menu actions
  const hoverMenuActions: NodeHoverMenuAction[] = [
    createRunAction(handleRunNode),
    createDuplicateAction(handleDuplicateNode),
    createAddNoteAction(handleEditNote),
    createSettingsAction(handleSettingsClick),
    createDeleteAction(handleDeleteNode)
  ];

  return (
    <div
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
    >
      {/* Hover Menu */}
      {showHoverMenu && (
        <div
          ref={menuRef}
          onMouseEnter={handleMenuHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <NodeHoverMenu
            nodeId={id}
            actions={hoverMenuActions}
            position="right"
          />
        </div>
      )}
      
      <NodeContainer selected={selected} className="overflow-visible">
        {/* Input Handles with Tooltips */}
        <div className="group relative">
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            style={{ 
              top: '110px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #6366f1',
              left: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 left-0 -translate-x-full" style={{ top: '75px', left: '-15px' }}>
            Input
          </div>
        </div>
        
        {/* Output Handles with Tooltips */}
        <div className="group relative">
          <Handle
            type="source"
            position={Position.Right}
            id="result"
            style={{ 
              top: '110px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #10b981',
              right: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 right-0 translate-x-full" style={{ top: '75px', right: '-15px' }}>
            Result
          </div>
        </div>
        
        <div className="group relative">
          <Handle
            type="source"
            position={Position.Right}
            id="error"
            style={{ 
              top: '140px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #ef4444',
              right: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 right-0 translate-x-full" style={{ top: '105px', right: '-15px' }}>
            Error
          </div>
        </div>
        
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-3 border-b border-border rounded-t-md',
          'bg-gradient-to-r from-violet-500/10 to-blue-400/10'
        )}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 p-1.5 rounded-md bg-violet-100 text-violet-600">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-medium truncate text-violet-700">Workflow Runner</h3>
          </div>
          <div className="flex items-center gap-1">
            {!nodeData.workflowId && (
              <Badge variant="outline" className="px-1.5 py-0 h-5 text-amber-600 border-amber-200 bg-amber-50">
                <ArrowRight size={11} className="mr-1" /> Needs Workflow
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-violet-600"
              onClick={handleSettingsClick}
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <NodeContent padding="normal">
          {/* Warning if no workflow is selected */}
          {!nodeData.workflowId && (
            <div className="mt-1 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md">
              Please select a workflow in settings
            </div>
          )}
          
          {/* Settings access button */}
          <div className="mt-2 mb-3 flex items-center justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs text-slate-600"
              onClick={handleSettingsClick}
            >
              <Settings size={12} className="mr-1.5" />
              Configure Workflow Runner
            </Button>
          </div>
          
          {/* Workflow Info */}
          {nodeData.workflowId > 0 && (
            <div className="mt-2 flex flex-col gap-1 text-slate-700 p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">Running:</span>
                <span className="font-medium text-violet-600">{workflowName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">Mode:</span>
                <span className="font-medium">
                  {nodeData.waitForResult ? 'Synchronous' : 'Asynchronous'}
                </span>
              </div>
              {nodeData.waitForResult && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Timeout:</span>
                  <span className="font-medium">{(nodeData.timeout / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
          
          {/* Run Button if workflow is selected */}
          {nodeData.workflowId > 0 && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-7 text-xs bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100"
                onClick={handleRunNode}
              >
                <Play size={12} className="mr-1.5" />
                Run Workflow
              </Button>
            </div>
          )}
          
          {/* Node Note Display */}
          {(data as any).note && (data as any).showNote && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-md">
              <div className="font-medium mb-1">Note:</div>
              <div>{(data as any).note}</div>
            </div>
          )}
        </NodeContent>
      </NodeContainer>
    </div>
  );
};