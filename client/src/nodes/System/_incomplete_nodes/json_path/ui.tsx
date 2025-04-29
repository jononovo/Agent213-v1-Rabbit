/**
 * JSONPath Node UI Component
 * 
 * This component renders an interface for configuring JSONPath queries
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JSONPathNodeData } from './executor';
import { FileSearch } from 'lucide-react';

export const defaultData: JSONPathNodeData = {
  path: '$.data'
};

export function component({ 
  data, 
  onChange,
  isConnectable = true
}: { 
  data: JSONPathNodeData; 
  onChange: (data: JSONPathNodeData) => void;
  isConnectable?: boolean;
}) {
  const [path, setPath] = useState(data.path || defaultData.path);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setPath(newPath);
    onChange({ ...data, path: newPath });
  };

  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <FileSearch className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">JSONPath</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="path" className="text-xs">Path Expression</Label>
          <Input
            id="path"
            value={path}
            onChange={handlePathChange}
            placeholder="$.path.to.property"
            className="mt-1 text-xs font-mono"
          />
        </div>
        
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <p className="font-medium mb-1">Examples:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>$.user.name</li>
            <li>$.products[0].price</li>
            <li>$.results.items</li>
          </ul>
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
}

export const validator = (data: JSONPathNodeData) => {
  const errors: string[] = [];
  
  if (!data.path || data.path.trim() === '') {
    errors.push('JSONPath expression cannot be empty');
  }
  
  // Basic validation for JSONPath format
  if (data.path && !data.path.startsWith('$')) {
    errors.push('JSONPath expression should start with $');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};