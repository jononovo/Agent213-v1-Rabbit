/**
 * Webhook Trigger Node UI Component
 * 
 * This component renders the webhook trigger node in the workflow editor.
 */

import React, { useState, useEffect } from 'react';
import { Globe, Link } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function WebhookTriggerNode({ id, data }: { id: string, data: any }) {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Generate the webhook URL when the component mounts or settings change
  useEffect(() => {
    // Use the custom path if provided, otherwise generate a URL with workflowId and nodeId
    const path = data?.settings?.path;
    const workflowId = data?.workflowId || 'unknown';
    
    const endpoint = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${id}`;
    
    const protocol = window.location.protocol;
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}`;
    
    setWebhookUrl(`${baseUrl}/api/${endpoint}`);
  }, [id, data?.settings?.path, data?.workflowId]);
  
  // Function to copy the webhook URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Get the allowed methods as a string
  const allowedMethods = data?.settings?.methods 
    ? data.settings.methods.join(', ') 
    : 'POST';
  
  // Node content with webhook URL display
  const nodeContent = (
    <div className="p-4 flex flex-col gap-3">
      {/* Badge moved to header in BaseNode */}
      
      <div className="bg-muted/80 p-2 rounded-md flex flex-col gap-1">
        <div className="text-xs text-muted-foreground mb-1">Webhook URL:</div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono bg-background p-1.5 rounded border flex-1 truncate">
            {webhookUrl}
          </div>
          <button 
            onClick={copyToClipboard}
            className="p-1 hover:bg-muted rounded"
            title="Copy webhook URL"
          >
            {copied ? (
              <span className="text-xs text-green-500">Copied!</span>
            ) : (
              <Link className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Allowed methods: <span className="font-semibold">{allowedMethods}</span>
        </div>
      </div>
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        hideInputHandles: true, // No inputs for trigger nodes
        type: 'webhook_trigger',
        icon: 'webhook', // Explicitly set the icon
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