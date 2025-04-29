/**
 * Webhook Trigger Node UI Component
 * 
 * This component renders the webhook trigger node in the workflow editor.
 * ENHANCED VERSION: Now using the Integration Engine for more autonomous operation.
 */

import React, { useState, useEffect } from 'react';
import { Globe, Link, CheckCircle } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as integrationClient from '@/utils/integrationClient';

export default function WebhookTriggerNode({ id, data }: { id: string, data: any }) {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  // Register and generate the webhook URL when the component mounts or settings change
  useEffect(() => {
    // Use the custom path if provided, otherwise generate a URL with workflowId and nodeId
    const path = data?.settings?.path;
    const workflowId = data?.workflowId || 'unknown';
    const methods = data?.settings?.methods || ['POST'];
    
    // Create a webhook path pattern with webhooks/ prefix
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${id}`;
    
    // Update the webhook URL
    const generatedUrl = integrationClient.getIntegrationUrl(webhookPath);
    setWebhookUrl(generatedUrl);
    
    // Register the webhook with the integration engine if it's a real workflow
    if (workflowId && workflowId !== 'unknown') {
      // Register with integration engine
      integrationClient.registerIntegration({
        nodeType: 'webhook_trigger',
        capabilities: {
          provides: {
            endpoint: true,
            webhook: true
          },
          endpoint: {
            pathTemplate: webhookPath,
            methods: methods || ['POST']
          }
        },
        workflowId: typeof workflowId === 'string' ? parseInt(workflowId, 10) : workflowId,
        nodeId: id,
        description: `Webhook trigger for workflow ${workflowId}, node ${id}`
      }).then(() => {
        setRegistered(true);
      }).catch(error => {
        console.error('Error registering webhook during UI mount:', error);
        setRegistered(false);
      });
    }
  }, [id, data?.settings?.path, data?.workflowId, data?.settings?.methods]);
  
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
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-muted-foreground">Webhook URL:</div>
          {registered && (
            <div className="flex items-center gap-1 text-green-500 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Registered</span>
            </div>
          )}
        </div>
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
      
      <div className="text-xs text-muted-foreground">
        <p>This webhook is immediately available through the Integration Engine.</p>
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