/**
 * Workflow Output Node UI Component
 * 
 * This component renders the UI for the workflow_output node
 * in the workflow editor.
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle } from 'lucide-react';

import { NodeContainer } from '@/components/flow/NodeContainer';

interface WorkflowOutputProps {
  id: string;
  data: any;
  selected: boolean;
  isConnectable?: boolean;
}

export default memo(function WorkflowOutputNode({
  id,
  data,
  selected,
  isConnectable = true
}: WorkflowOutputProps) {
  // Extract node configuration
  const label = data.label || 'Workflow Output';
  const description = data.description || 'Captures workflow output';
  const formatOutput = data.formatOutput ?? true;
  const includeMetadata = data.includeMetadata ?? true;

  return (
    <NodeContainer 
      selected={selected}
      icon={<CheckCircle className="text-green-500" />}
      label={label}
      description={description}
      type="output" // Mark as output type for styling
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          left: '-6px', 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #22c55e' // Green border for output nodes
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[50px] text-xs text-slate-500">
        In
      </div>
      
      {/* Node content */}
      <div className="p-3 text-sm">
        <div className="text-slate-700">
          {formatOutput && (
            <p className="text-xs text-slate-600">Output formatted as JSON</p>
          )}
          {includeMetadata && (
            <p className="text-xs text-slate-600">Including execution metadata</p>
          )}
        </div>

        {(data as any)._hasError && (data as any)._errorMessage && (
          <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
            Error: {(data as any)._errorMessage}
          </div>
        )}
      </div>
    </NodeContainer>
  );
});