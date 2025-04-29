/**
 * API Integration Node Template - UI Component
 * 
 * This component renders the API node in the workflow editor.
 * It provides a user interface for configuring the API connection.
 */

import React, { useState, useEffect } from 'react';
import { BaseNode } from '@/nodes/Base';

// CUSTOMIZE THIS: Update component name and types to match your node
export default function MyApiNode({ id, data }: { id: string, data: any }) {
  // Implement your UI component logic here
  
  // Register with settings drawer if needed
  useEffect(() => {
    // Define the settings for the global settings drawer
    const settings = {
      title: 'API Integration Settings',
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          description: 'Your API key (secure)'
        },
        {
          key: 'endpoint',
          label: 'API Endpoint',
          type: 'text',
          description: 'The specific API endpoint to call'
        },
        {
          key: 'method',
          label: 'HTTP Method',
          type: 'select',
          description: 'The HTTP method to use for the request',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' }
          ]
        },
        {
          key: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          description: 'Request timeout in milliseconds'
        }
      ]
    };
    
    // Add the settings to the node data using onChange
    if (typeof (data as any).onChange === 'function') {
      (data as any).onChange({
        ...data,
        settings,
        label: "My API Integration", // CHANGE THIS to match your node name
        description: "Connect with an external API service", // CHANGE THIS to match your node description
        useGlobalSettingsOnly: true  // Use the global settings drawer only
      });
    }
  }, [id, data]);
  
  // Node content - displayed in the node UI
  // CUSTOMIZE THIS: Modify to show relevant information for your API node
  const nodeContent = (
    <div className="p-4 flex flex-col gap-3">
      <div className="text-sm font-medium">API Integration</div>
      
      {/* Display API endpoint info */}
      <div className="bg-muted/80 p-2 rounded-md text-xs">
        <div className="mb-1 text-muted-foreground">Endpoint:</div>
        <code className="bg-background p-1 rounded text-xs block truncate">
          {data?.settings?.endpoint || '/v1/resource'}
        </code>
      </div>
      
      {/* Method badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Method:</span>
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
          {data?.settings?.method || 'POST'}
        </span>
      </div>
      
      {/* API key status */}
      <div className="text-xs text-muted-foreground mt-1">
        API Key: {data?.settings?.apiKey ? 'Configured ✓' : 'Not configured ✗'}
      </div>
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        type: 'my_api_node', // CHANGE THIS to match your node type in definition.ts
        icon: 'globe', // You can change to a different icon
        childrenContent: nodeContent,
        // Pass through note properties
        note: data.note,
        showNote: data.showNote,
        // Use global settings drawer only
        useGlobalSettingsOnly: true
      }}
    />
  );
}