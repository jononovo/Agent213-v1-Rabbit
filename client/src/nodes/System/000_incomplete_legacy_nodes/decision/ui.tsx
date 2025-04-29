/**
 * Decision Node UI Component
 * 
 * This component provides an interface for creating conditional branch logic
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DecisionNodeData } from './executor';
import { GitBranchPlus } from 'lucide-react';

export const defaultData: DecisionNodeData = {
  condition: 'value === true'
};

export function component({ 
  data, 
  onChange,
  isConnectable = true
}: { 
  data: DecisionNodeData; 
  onChange: (data: DecisionNodeData) => void;
  isConnectable?: boolean;
}) {
  const [condition, setCondition] = useState(data.condition || defaultData.condition);

  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCondition = e.target.value;
    setCondition(newCondition);
    onChange({ ...data, condition: newCondition });
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
      
      <div className="flex items-center gap-2 mb-3">
        <GitBranchPlus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Decision</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="condition" className="text-xs">Condition Expression</Label>
          <Textarea
            id="condition"
            value={condition}
            onChange={handleConditionChange}
            className="font-mono text-xs min-h-[60px] mt-1"
            placeholder="Enter condition (e.g., value > 10)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use 'value' to reference the incoming data
          </p>
        </div>
        
        <div className="flex justify-between text-xs pt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>True path</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span>False path</span>
          </div>
        </div>
      </div>
      
      {/* True output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-emerald-500"
        style={{ left: '30%' }}
      />
      
      {/* False output handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false" 
        isConnectable={isConnectable}
        className="w-2 h-2 bg-rose-500"
        style={{ left: '70%' }}
      />
    </div>
  );
};

export const validator = (data: DecisionNodeData) => {
  const errors: string[] = [];
  
  if (!data.condition || data.condition.trim() === '') {
    errors.push('Condition cannot be empty');
  } else {
    // Try to validate the JavaScript syntax
    try {
      // We add 'return' to ensure it's a valid expression
      new Function('value', `return ${data.condition};`);
    } catch (error) {
      errors.push(`JavaScript syntax error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};