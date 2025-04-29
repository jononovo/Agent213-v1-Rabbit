/**
 * EditableHandle
 * 
 * A handle component that can be edited by the user.
 * Allows adding, removing, and renaming connection points dynamically.
 * Based on the Simple-AI.dev implementation.
 */

import React, { useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { cn } from '@/lib/utils';
import { Edit2, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Handle data interface for type information
export interface HandleData {
  id: string;
  label: string;
  description?: string;
}

interface EditableHandleProps {
  id: string;
  type: 'source' | 'target';
  position: Position;
  label: string;
  nodeId: string; // Parent node ID for updating node internals
  isConnectable?: boolean;
  onLabelChange?: (id: string, newLabel: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  description?: string;
  dataType?: string;
  style?: React.CSSProperties;
  handleStyle?: React.CSSProperties;
}

/**
 * EditableHandle Component
 * 
 * A customizable handle for ReactFlow nodes that supports editing and deletion.
 * Takes design cues from Simple-AI.dev's implementation.
 */
export function EditableHandle({
  id,
  type,
  position,
  label,
  nodeId,
  isConnectable = true,
  onLabelChange,
  onDelete,
  className,
  description,
  dataType,
  style,
  handleStyle
}: EditableHandleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Determine style based on position
  const isHorizontal = position === Position.Left || position === Position.Right;
  const isInput = type === 'target';
  
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  const handleSave = useCallback(() => {
    if (onLabelChange && editedLabel.trim() !== '') {
      onLabelChange(id, editedLabel);
      updateNodeInternals(nodeId);
    }
    setIsEditing(false);
  }, [editedLabel, id, nodeId, onLabelChange, updateNodeInternals]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedLabel(label);
      setIsEditing(false);
    }
  }, [handleSave, label]);
  
  const handleDeleteClick = useCallback(() => {
    if (onDelete) {
      onDelete(id);
      updateNodeInternals(nodeId);
    }
  }, [id, nodeId, onDelete, updateNodeInternals]);

  // Get handle color based on data type
  const getHandleColorClass = () => {
    switch (dataType) {
      case 'string': return 'border-blue-500';
      case 'number': return 'border-green-500';
      case 'boolean': return 'border-yellow-500';
      case 'object': return 'border-purple-500';
      case 'array': return 'border-indigo-500';
      default: return type === 'target' ? 'border-blue-500' : 'border-green-500';
    }
  };
  
  // Determine label position based on handle position
  const getLabelClassName = () => {
    switch (position) {
      case Position.Left: return 'ml-2';
      case Position.Right: return 'mr-2';
      case Position.Top: return 'mt-1';
      case Position.Bottom: return 'mb-1';
      default: return '';
    }
  };
  
  return (
    <div 
      className={cn(
        'relative flex items-center my-2',
        isHorizontal ? 'flex-row' : 'flex-col',
        isInput && position === Position.Left && 'flex-row',
        !isInput && position === Position.Right && 'flex-row-reverse',
        className
      )}
      style={style}
    >
      <Handle
        type={type}
        position={position}
        id={id}
        isConnectable={isConnectable}
        className={cn(
          'w-3 h-3 border-2 bg-background',
          getHandleColorClass()
        )}
        style={handleStyle}
      />
      
      <div className={cn(
        'flex items-center',
        getLabelClassName()
      )}>
        {isEditing ? (
          <Input
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            size={10}
            className="h-6 px-1 py-0 text-xs"
          />
        ) : (
          <>
            <span 
              className="text-xs text-muted-foreground cursor-default whitespace-nowrap"
              title={description || label}
            >
              {label}
              {dataType && (
                <span className="text-[10px] ml-1 text-slate-400">
                  ({dataType})
                </span>
              )}
            </span>
            <button
              onClick={handleEdit}
              className="ml-1 text-slate-400 opacity-50 hover:opacity-100 focus:opacity-100"
              title="Edit handle name"
            >
              <Edit2 size={10} />
            </button>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="ml-1 text-destructive opacity-50 hover:opacity-100 focus:opacity-100"
                title="Delete handle"
              >
                <X size={10} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Creating dialog component re-implementation in EditableHandleDialog.tsx
 */