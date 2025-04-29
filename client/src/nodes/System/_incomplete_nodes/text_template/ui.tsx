/**
 * Text Template Node UI Component
 * 
 * This component provides an interface for creating text templates with variable placeholders
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextTemplateNodeData } from './executor';
import { FileText } from 'lucide-react';

export const defaultData: TextTemplateNodeData = {
  template: 'Hello, {{name}}!'
};

export function component({ 
  data, 
  onChange,
  isConnectable = true
}: { 
  data: TextTemplateNodeData; 
  onChange: (data: TextTemplateNodeData) => void;
  isConnectable?: boolean; 
}) {
  const [template, setTemplate] = useState(data.template || defaultData.template);
  
  // Extract variables from the template
  const extractVariables = (templateText: string): string[] => {
    const matches = templateText.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());
  };
  
  const variables = extractVariables(template);
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTemplate = e.target.value;
    setTemplate(newTemplate);
    onChange({ ...data, template: newTemplate });
  };

  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="variables"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Text Template</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="template" className="text-xs">Template Text</Label>
          <Textarea
            id="template"
            value={template}
            onChange={handleTemplateChange}
            className="font-mono text-xs min-h-[80px] mt-1"
            placeholder="Enter template with placeholders like {{variable}}"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use &#123;&#123;variableName&#125;&#125; for variables
          </p>
        </div>
        
        {variables.length > 0 && (
          <div>
            <Label className="text-xs">Detected Variables</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {variables.map((variable, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="text"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
};

export const validator = (data: TextTemplateNodeData) => {
  const errors: string[] = [];
  
  if (!data.template || data.template.trim() === '') {
    errors.push('Template cannot be empty');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};