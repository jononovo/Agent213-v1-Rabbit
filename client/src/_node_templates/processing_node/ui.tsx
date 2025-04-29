/**
 * Processing Node Template - UI Component
 * 
 * This component renders the processing node in the workflow editor.
 * It provides a visual representation of the processing configuration and state.
 */

import React from 'react';
import { Process, Settings, FilterX, Database, ZapOff, ZapOff as LucideFilterX } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';

// CUSTOMIZE THIS: Update the interface to match your node's data structure
interface ProcessingNodeData {
  label?: string;
  description?: string;
  processingMode?: 'transform' | 'filter' | 'aggregate' | 'validate' | 'custom';
  processingLogic?: string;
  enableValidation?: boolean;
  errorHandling?: 'throw' | 'continue' | 'fallback';
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  settings?: Record<string, any>;
  settingsData?: Record<string, any>;
  note?: string;
  showNote?: boolean;
  [key: string]: any;
}

// CUSTOMIZE THIS: Update component name to match your node type
export default function MyProcessingNode({ id, data }: { id: string, data: ProcessingNodeData }) {
  // Extract node settings with defaults
  const settings = data?.settingsData || data?.settings || {};
  const processingMode = settings.processingMode || data.processingMode || 'transform';
  const enableValidation = settings.enableValidation === true || data.enableValidation === true;
  const errorHandling = settings.errorHandling || data.errorHandling || 'throw';
  
  // Get execution status
  const isProcessing = data.isProcessing;
  const isComplete = data.isComplete;
  const hasError = data.hasError;
  
  // Helper to get mode icon
  const getModeIcon = () => {
    switch (processingMode) {
      case 'filter':
        return <LucideFilterX className="h-4 w-4" />;
      case 'aggregate':
        return <Database className="h-4 w-4" />;
      case 'validate':
        return <ZapOff className="h-4 w-4" />;
      case 'custom':
      case 'transform':
      default:
        return <Process className="h-4 w-4" />;
    }
  };
  
  // Get status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Processing</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Function to format code for display (show just first 2-3 lines)
  const formatCodePreview = (code?: string) => {
    if (!code) return 'No processing logic defined';
    
    const lines = code.split('\n');
    if (lines.length <= 3) return code;
    
    return lines.slice(0, 2).join('\n') + '\n...';
  };
  
  // Node content
  const nodeContent = (
    <div className="p-4 flex flex-col gap-2">
      {/* Mode and Settings Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getModeIcon()}
          <Badge variant="outline" className="capitalize">
            {processingMode}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {enableValidation && (
            <Badge variant="outline" className="text-xs">
              Validation
            </Badge>
          )}
          {errorHandling !== 'throw' && (
            <Badge variant="outline" className="text-xs">
              Error: {errorHandling}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Code Preview (if available) */}
      {settings.processingLogic && (
        <div className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded text-muted-foreground">
          {formatCodePreview(settings.processingLogic)}
        </div>
      )}
      
      {/* Status Badge */}
      {getStatusBadge() && (
        <div className="mt-1">
          {getStatusBadge()}
        </div>
      )}
      
      {/* Error Message (if any) */}
      {hasError && data.errorMessage && (
        <div className="mt-1 text-xs text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">
          {data.errorMessage}
        </div>
      )}
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        type: 'my_processing_node', // CHANGE THIS to match your node type in definition.ts
        icon: 'process', // Icon for the node
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