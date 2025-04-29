/**
 * Data Transform Node UI Component
 * 
 * This component provides an interface for creating data transformations with JavaScript
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ArrowUpDown, Wrench } from 'lucide-react';
import { DataTransformNodeData, Transformation } from './executor';

export const defaultData: DataTransformNodeData = {
  transformations: [
    {
      name: "Default Transform",
      expression: "return data;",
      enabled: true
    }
  ]
};

export function component({ 
  data, 
  onChange,
  isConnectable = true
}: { 
  data: DataTransformNodeData; 
  onChange: (data: DataTransformNodeData) => void;
  isConnectable?: boolean;
}) {
  const [transformations, setTransformations] = useState<Transformation[]>(
    data.transformations?.length ? data.transformations : defaultData.transformations
  );

  const addTransformation = () => {
    const newTransformation: Transformation = {
      name: `Transform ${transformations.length + 1}`,
      expression: "return data;",
      enabled: true
    };
    
    const updatedTransformations = [...transformations, newTransformation];
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const updateTransformation = (index: number, updatedTransform: Partial<Transformation>) => {
    const updatedTransformations = transformations.map((t, i) => 
      i === index ? { ...t, ...updatedTransform } : t
    );
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const deleteTransformation = (index: number) => {
    const updatedTransformations = transformations.filter((_, i) => i !== index);
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const moveTransformation = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === transformations.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedTransformations = [...transformations];
    
    // Swap positions
    [updatedTransformations[index], updatedTransformations[newIndex]] = 
    [updatedTransformations[newIndex], updatedTransformations[index]];
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
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
        <Wrench className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Data Transform</h3>
      </div>
      
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {transformations.map((transformation, index) => (
          <div key={index} className="p-2 border rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={transformation.enabled}
                  onCheckedChange={(checked) => updateTransformation(index, { enabled: checked })}
                  id={`transform-${index}-enabled`}
                  className="scale-75 origin-left"
                />
                <Input
                  value={transformation.name}
                  onChange={(e) => updateTransformation(index, { name: e.target.value })}
                  className="h-7 w-[180px] text-xs"
                  placeholder="Transformation name"
                />
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => moveTransformation(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUpDown className="h-3 w-3 rotate-90" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => moveTransformation(index, 'down')}
                  disabled={index === transformations.length - 1}
                >
                  <ArrowUpDown className="h-3 w-3 -rotate-90" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive"
                  onClick={() => deleteTransformation(index)}
                  disabled={transformations.length <= 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <Textarea
                value={transformation.expression}
                onChange={(e) => updateTransformation(index, { expression: e.target.value })}
                className="font-mono text-xs min-h-[60px]"
                placeholder="Enter JavaScript code to transform data..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use 'data' to access input and 'return' to send output
              </p>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={addTransformation}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Transformation
        </Button>
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

export const validator = (data: DataTransformNodeData) => {
  const errors: string[] = [];
  
  if (!data.transformations || data.transformations.length === 0) {
    errors.push('At least one transformation is required');
  } else {
    // Check each transformation
    data.transformations.forEach((transform, index) => {
      if (!transform.name || transform.name.trim() === '') {
        errors.push(`Transformation #${index + 1} must have a name`);
      }
      
      if (!transform.expression || transform.expression.trim() === '') {
        errors.push(`Transformation #${index + 1} must have an expression`);
      } else {
        // Try to validate the JavaScript syntax
        try {
          new Function('data', transform.expression);
        } catch (error) {
          errors.push(`Syntax error in transformation "${transform.name}": ${
            error instanceof Error ? error.message : String(error)
          }`);
        }
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};