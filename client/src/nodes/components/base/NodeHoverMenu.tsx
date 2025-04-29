/**
 * Node Hover Menu Component
 * 
 * This is a reusable component that displays action buttons when hovering over a node.
 * The menu appears as a vertical toolbar on the right side of the node.
 * 
 * Features:
 * - Customizable action buttons (duplicate, delete, settings, etc.)
 * - TypeScript interface for type-safe props
 * - Styled with Tailwind CSS for consistent appearance
 */

import React from 'react';
import { Copy, Trash2, Settings, Edit, Bot, Play, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NodeHoverMenuAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: (e?: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'primary';
}

export interface NodeHoverMenuProps {
  nodeId: string;
  actions: NodeHoverMenuAction[];
  position?: 'right' | 'left' | 'top' | 'bottom';
  className?: string;
}

/**
 * Node Hover Menu Component
 */
const NodeHoverMenu: React.FC<NodeHoverMenuProps> = ({
  nodeId,
  actions,
  position = 'right',
  className = '',
}) => {
  // Determine position-specific styles
  const positionStyles = {
    right: 'right-0 top-0 translate-x-[calc(100%+14px)] flex-col',
    left: 'left-0 top-0 -translate-x-[calc(100%+14px)] flex-col',
    top: 'top-0 left-1/2 -translate-y-[calc(100%+4px)] -translate-x-1/2 flex-row',
    bottom: 'bottom-0 left-1/2 translate-y-[calc(100%+4px)] -translate-x-1/2 flex-row'
  };

  return (
    <div
      className={`absolute z-50 bg-background rounded-md shadow-lg border border-border p-1 flex gap-1 ${positionStyles[position]} ${className}`}
      data-node-id={nodeId}
    >
      {actions.map((action) => {
        // Determine button color based on variant
        const variantStyles = {
          default: '',
          destructive: 'text-red-500 hover:text-red-600',
          primary: 'text-blue-500 hover:text-blue-600'
        };

        return (
          <Button
            key={action.id}
            variant="ghost"
            size="icon"
            className={`h-8 w-8 hover:bg-slate-100 ${variantStyles[action.variant || 'default']}`}
            onClick={(e) => {
              // Add safety check before calling stopPropagation
              if (e) e.stopPropagation();
              // Pass the event to onClick in case it expects it
              action.onClick(e);
            }}
            title={action.label}
          >
            {action.icon}
          </Button>
        );
      })}
    </div>
  );
};

// Common action creators to make it easy to build menus
export const createDuplicateAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'duplicate',
  icon: <Copy className="h-4 w-4" />,
  label: 'Duplicate Node',
  onClick,
  variant: 'default'
});

export const createDeleteAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'delete',
  icon: <Trash2 className="h-4 w-4" />,
  label: 'Delete Node',
  onClick,
  variant: 'destructive'
});

export const createSettingsAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'settings',
  icon: <Settings className="h-4 w-4" />,
  label: 'Node Settings',
  onClick,
  variant: 'primary'
});

export const createEditAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'edit',
  icon: <Edit className="h-4 w-4" />,
  label: 'Edit Node',
  onClick,
  variant: 'primary'
});

export const createAgentModifyAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'agent-modify',
  icon: <Bot className="h-4 w-4" />,
  label: 'Agent Modify',
  onClick,
  variant: 'primary'
});

export const createRunAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'run',
  icon: <Play className="h-4 w-4" />,
  label: 'Run Node',
  onClick,
  variant: 'primary'
});

/**
 * Create an action for adding/editing a note
 */
export const createAddNoteAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'add-note',
  icon: <StickyNote className="h-4 w-4 text-amber-500" />,
  label: 'Add/Edit Note',
  onClick,
  variant: 'default'
});

export default NodeHoverMenu;