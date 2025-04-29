/**
 * Processing Node Template - UI Component
 * 
 * This component renders the processing node in the workflow editor.
 */

import React from 'react';
import { Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Handle, Position } from 'reactflow';

export default function MyProcessingNode({ id, data }: { id: string, data: any }) {
  // Extract essential settings
  const settings = data?.settings || {};
  const processingLogic = settings.processingLogic || 'function process(data, options) { return data; }';
  
  // Get execution status
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Get status badge
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Processing</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Format code preview (show first 2 lines only)
  const formatCodePreview = (code: string) => {
    const lines = code.split('\n');
    if (lines.length <= 2) return code;
    return lines.slice(0, 2).join('\n') + '\n...';
  };

  return (
    <div className="bg-background border rounded-md shadow-sm">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
      
      {/* Header */}
      <div className="border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary/10">
            <Code className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">{data.label || 'Process'}</div>
            <div className="text-xs text-muted-foreground">{data.description || 'Processes data using JavaScript'}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {/* Code preview */}
        <div className="text-xs font-mono bg-muted/50 p-2 rounded overflow-hidden">
          {formatCodePreview(processingLogic)}
        </div>
        
        {/* Error message (if any) */}
        {hasError && data.errorMessage && (
          <div className="text-xs text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}