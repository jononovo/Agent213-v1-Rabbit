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

export default function WebhookTriggerNode({ id, data }: { id: string, data: any }) {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  // Get current workflow ID from URL
  const getWorkflowIdFromUrl = () => {
    // Extract workflow ID from URL if possible
    if (typeof window !== 'undefined') {
      const urlMatch = window.location.pathname.match(/\/workflow-editor\/(\d+)/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
    }
    return null;
  };

  // Register and generate the webhook URL when the component mounts or settings change
  useEffect(() => {
    // Use the custom path if provided, otherwise generate a URL with workflowId and nodeId
    const path = data?.settings?.path;
    
    // Try to get workflowId from multiple sources in order of reliability:
    // 1. From data props if available
    // 2. From URL if this is an edit view
    // 3. Use 'unknown' as a fallback only if nothing else works
    let workflowId = data?.workflowId;
    if (!workflowId || workflowId === 'unknown') {
      const urlWorkflowId = getWorkflowIdFromUrl();
      if (urlWorkflowId) {
        workflowId = urlWorkflowId;
      } else {
        workflowId = 'unknown';
      }
    }
    
    const methods = data?.settings?.methods || ['POST'];
    
    // Create a webhook path pattern with webhooks/ prefix
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${id}`;
    
    // Generate the webhook URL directly in the node (no dependency on integrationClient)
    // Get the current hostname - only replace the port
    const getWebhookUrl = (path: string): string => {
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        // Use port 3001 for the integration engine
        const integrationEngineBaseUrl = `${protocol}//${hostname}:3001`;
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        return `${integrationEngineBaseUrl}/${normalizedPath}`;
      }
      return `http://localhost:3001/${path}`;
    };
    
    const generatedUrl = getWebhookUrl(webhookPath);
    setWebhookUrl(generatedUrl);
    
    // Register the webhook with the integration engine if it's a real workflow
    if (workflowId && workflowId !== 'unknown') {
      // Direct registration with the Integration Engine (no dependency on integrationClient)
      const registerWithIntegrationEngine = async () => {
        try {
          const registrationData = {
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
          };
          
          // Direct API call to register the webhook
          const response = await fetch('/api/integration/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
          });
          
          if (response.ok) {
            setRegistered(true);
          } else {
            console.error('Error registering webhook:', await response.text());
            setRegistered(false);
          }
        } catch (error) {
          console.error('Error registering webhook during UI mount:', error);
          setRegistered(false);
        }
      };
      
      // Call the registration function
      registerWithIntegrationEngine();
    }
  }, [id, data?.settings?.path, data?.workflowId, data?.settings?.methods, getWorkflowIdFromUrl]);
  
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
        
        {webhookUrl.includes('/unknown/') ? (
          // Show message when workflow ID is unknown (not saved yet)
          <div className="flex flex-col gap-1">
            <div className="text-xs text-amber-500 font-semibold bg-amber-500/10 p-2 rounded border border-amber-200">
              ⚠️ Save the workflow to generate a valid webhook URL
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              The webhook URL will be available after saving.
            </div>
          </div>
        ) : (
          // Show normal URL display when workflow is saved
          <div className="flex flex-col gap-1">
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
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        {webhookUrl.includes('/unknown/') ? (
          <p>Webhook will be registered when the workflow is saved.</p>
        ) : (
          <p>This webhook is immediately available through the Integration Engine.</p>
        )}
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