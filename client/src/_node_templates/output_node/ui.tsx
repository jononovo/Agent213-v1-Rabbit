/**
 * Output Node Template - UI Component
 * 
 * This component renders the output node in the workflow editor.
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Handle, Position } from 'reactflow';

export default function MyOutputNode({ id, data }: { id: string, data: any }) {
  // Extract essential settings with defaults
  const settings = data?.settings || {};
  const destinationUrl = settings.destinationUrl || 'No destination configured';
  const method = settings.method || 'POST';
  const formatOutput = settings.formatOutput === true;
  
  // Get status for display
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Function to open URL in new tab
  const openUrl = (e: React.MouseEvent) => {
    if (!settings.destinationUrl) return;
    e.stopPropagation();
    window.open(settings.destinationUrl, '_blank', 'noopener,noreferrer');
  };
  
  // Get status badge
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sending</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
    return null;
  };
  
  // Format URL for display
  const displayUrl = destinationUrl?.length > 35 ? destinationUrl.substring(0, 32) + '...' : destinationUrl;
  
  return (
    <div className="bg-background border rounded-md shadow-sm">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      
      {/* Header */}
      <div className="border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary/10">
            <ExternalLink className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">{data.label || 'Output'}</div>
            <div className="text-xs text-muted-foreground">{data.description || 'Sends data to external system'}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {/* URL display */}
        <div className="bg-muted/80 p-2 rounded-md flex flex-col">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{method}</Badge>
            <div className="text-xs text-muted-foreground">Destination</div>
          </div>
          
          <div 
            onClick={openUrl}
            className="text-xs font-mono mt-1 truncate hover:text-primary cursor-pointer flex items-center"
            title={destinationUrl}
          >
            {displayUrl}
            {settings.destinationUrl && <ExternalLink className="h-3 w-3 ml-1 inline" />}
          </div>
        </div>
        
        {/* Simple config summary */}
        {formatOutput && (
          <div className="text-xs text-muted-foreground">
            Format output: Yes
          </div>
        )}
      </div>
    </div>
  );
}