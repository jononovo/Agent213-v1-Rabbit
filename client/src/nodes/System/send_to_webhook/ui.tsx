/**
 * Send to Webhook Node UI Component
 * 
 * This component renders the send to webhook node in the workflow editor.
 * 
 * Updated to support two modes:
 * 1. Send data to a specific webhook URL (default)
 * 2. Respond to the original webhook trigger request
 */

import React from 'react';
import { Send, ExternalLink } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';

export default function SendToWebhookNode({ id, data }: { id: string, data: any }) {
  // Extract node settings
  const settings = data?.settings || {};
  const isWebhookResponse = settings.respondToOriginal === true || 
                           settings.respondToOriginal === 'true';
  const url = settings.url || 'No URL configured';
  const method = settings.method || 'POST';
  
  // Get execution status for conditional display
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Function to open URL in new tab (only for external webhooks)
  const openUrl = (e: React.MouseEvent) => {
    if (isWebhookResponse) return;
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sending</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
    return null;
  };
  
  // Node content - webhookResponse mode
  const webhookResponseContent = (
    <div className="p-4 flex flex-col gap-2">
      <div className="bg-blue-500/10 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-blue-500/20 text-blue-500">RESPONSE</Badge>
          <div className="text-xs text-muted-foreground">Original webhook response</div>
        </div>
        
        <div className="text-xs mt-2 text-muted-foreground">
          This node will respond to the original webhook request that triggered this workflow.
        </div>
      </div>
      
      {getStatusBadge() && (
        <div className="mt-1">
          {getStatusBadge()}
        </div>
      )}
    </div>
  );
  
  // Format URL for display (truncate if too long)
  const displayUrl = url?.length > 35 ? url.substring(0, 32) + '...' : url;
  
  // Node content - standard mode (external webhook)
  const standardContent = (
    <div className="p-4 flex flex-col gap-2">
      {/* Title moved to the header in BaseNode */}
      
      <div className="bg-muted/80 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-muted/50">{method}</Badge>
          <div className="text-xs text-muted-foreground">Destination URL</div>
        </div>
        
        <div 
          onClick={openUrl}
          className="text-xs font-mono mt-1 truncate hover:text-primary cursor-pointer flex items-center"
          title={url}
        >
          {displayUrl}
          <ExternalLink className="h-3 w-3 ml-1 inline" />
        </div>
      </div>
      
      {/* Display retry and timeout settings if configured */}
      {(settings.retryCount > 0 || settings.timeout) && (
        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
          {settings.retryCount > 0 && (
            <span>Retries: {settings.retryCount}</span>
          )}
          {settings.timeout && (
            <span>Timeout: {settings.timeout}ms</span>
          )}
        </div>
      )}
      
      {getStatusBadge() && (
        <div className="mt-1">
          {getStatusBadge()}
        </div>
      )}
    </div>
  );
  
  // Choose the appropriate content based on mode
  const nodeContent = isWebhookResponse ? webhookResponseContent : standardContent;

  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        hideOutputHandles: false, // Show output handles
        type: 'send_to_webhook',
        icon: 'send', // Explicitly set the icon
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