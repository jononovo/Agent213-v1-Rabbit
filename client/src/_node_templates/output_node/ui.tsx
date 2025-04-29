/**
 * Output Node Template - UI Component
 * 
 * This component renders the output node in the workflow editor.
 * It provides a user-friendly visualization of the node's configuration.
 */

import React from 'react';
import { ArrowUpToLine, ExternalLink } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';

// CUSTOMIZE THIS: Update component name to match your node type
export default function MyOutputNode({ id, data }: { id: string, data: any }) {
  // Extract node settings
  const settings = data?.settings || {};
  const destinationUrl = settings.destinationUrl || 'No destination configured';
  const method = settings.method || 'POST';
  const formatOutput = settings.formatOutput === true || settings.formatOutput === 'true';
  const responseMode = settings.responseMode || 'data';
  
  // Get execution status for conditional display
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Function to open URL in new tab
  const openUrl = (e: React.MouseEvent) => {
    if (!settings.destinationUrl) return;
    e.stopPropagation();
    window.open(settings.destinationUrl, '_blank', 'noopener,noreferrer');
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sending</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
    return null;
  };
  
  // Format URL for display (truncate if too long)
  const displayUrl = destinationUrl?.length > 35 ? destinationUrl.substring(0, 32) + '...' : destinationUrl;
  
  // Node content
  // CUSTOMIZE THIS: Update to match your node's specific information display needs
  const nodeContent = (
    <div className="p-4 flex flex-col gap-2">
      {/* URL display */}
      <div className="bg-muted/80 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-muted/50">{method}</Badge>
          <div className="text-xs text-muted-foreground">Destination URL</div>
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
      
      {/* Configuration summary */}
      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          Format: {formatOutput ? 'Yes' : 'No'}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Response: {responseMode}
        </Badge>
        {settings.retryCount > 0 && (
          <Badge variant="outline" className="text-xs">
            Retries: {settings.retryCount}
          </Badge>
        )}
      </div>
      
      {/* Status badge */}
      {getStatusBadge() && (
        <div className="mt-1">
          {getStatusBadge()}
        </div>
      )}
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        hideOutputHandles: true, // Output nodes typically don't have outputs
        type: 'my_output_node', // CHANGE THIS to match your node type in definition.ts
        icon: 'arrowUpToLine', // Explicitly set the icon
        childrenContent: nodeContent, // Use childrenContent instead of children
        // Pass through note properties
        note: data.note,
        showNote: data.showNote,
        // Use global settings drawer only
        useGlobalSettingsOnly: true
      }}
    />
  );
}