/**
 * HTTP Request Node UI Component
 * 
 * This file contains the React component used to render the HTTP request node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Default data for the node
export const defaultData = {
  url: '',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: '',
  timeout: 10000
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.url) {
    errors.push('URL is required');
  }
  
  // Basic URL validation
  if (data.url && !data.url.startsWith('http://') && !data.url.startsWith('https://')) {
    errors.push('URL must start with http:// or https://');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [localUrl, setLocalUrl] = useState(data.url || '');
  const [localMethod, setLocalMethod] = useState(data.method || 'GET');
  const [localHeaders, setLocalHeaders] = useState(
    typeof data.headers === 'object' 
      ? JSON.stringify(data.headers, null, 2) 
      : '{\n  "Content-Type": "application/json"\n}'
  );
  const [localBody, setLocalBody] = useState(data.body || '');
  
  // Update the node data when values change
  const updateNodeData = (updates: Record<string, any>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalUrl(newValue);
    updateNodeData({ url: newValue });
  };
  
  const handleMethodChange = (value: string) => {
    setLocalMethod(value);
    updateNodeData({ method: value });
  };
  
  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalHeaders(newValue);
    
    try {
      const parsedHeaders = JSON.parse(newValue);
      updateNodeData({ headers: parsedHeaders });
    } catch (err) {
      // Don't update if not valid JSON
      console.warn('Invalid headers JSON');
    }
  };
  
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalBody(newValue);
    updateNodeData({ body: newValue });
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="body"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500 left-[30%]"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="headers"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500 left-[70%]"
      />
      
      <Tabs defaultValue="request" className="w-full">
        <TabsList className="w-full mb-2">
          <TabsTrigger value="request" className="flex-1">Request</TabsTrigger>
          <TabsTrigger value="headers" className="flex-1">Headers</TabsTrigger>
          <TabsTrigger value="body" className="flex-1">Body</TabsTrigger>
        </TabsList>
        
        <TabsContent value="request" className="space-y-3">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={localUrl}
              onChange={handleUrlChange}
              placeholder="https://api.example.com/data"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="method">Method</Label>
            <Select value={localMethod} onValueChange={handleMethodChange}>
              <SelectTrigger id="method" className="mt-1">
                <SelectValue placeholder="Select HTTP method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        
        <TabsContent value="headers" className="space-y-3">
          <div>
            <Label htmlFor="headers">Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={localHeaders}
              onChange={handleHeadersChange}
              placeholder={'{\n  "Content-Type": "application/json"\n}'}
              rows={6}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="body" className="space-y-3">
          <div>
            <Label htmlFor="body">Request Body</Label>
            <Textarea
              id="body"
              value={localBody}
              onChange={handleBodyChange}
              placeholder="Enter request body here..."
              rows={8}
              className="mt-1"
              disabled={localMethod === 'GET' || localMethod === 'HEAD'}
            />
            {(localMethod === 'GET' || localMethod === 'HEAD') && (
              <p className="text-xs text-muted-foreground mt-1">
                {localMethod} requests cannot have a body
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="response"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500 left-[25%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="data"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500 left-[50%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="status"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-yellow-500 left-[75%]"
      />
    </div>
  );
};