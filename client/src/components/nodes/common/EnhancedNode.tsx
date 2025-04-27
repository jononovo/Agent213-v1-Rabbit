/**
 * Enhanced Node - DEPRECATED
 * 
 * @deprecated This component is deprecated. Use BaseNode from /nodes/Base/ui.tsx instead.
 * 
 * This component wraps our EnhancedBaseNode to make it compatible with ReactFlow
 * by passing through the necessary props.
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { EnhancedBaseNode, EnhancedNodeData } from './EnhancedBaseNode';

interface EnhancedNodeWrapperProps {
  id: string;
  data: any;
  selected?: boolean;
  isConnectable?: boolean;
  children?: React.ReactNode;
  showContextMenu?: boolean;
  onSettingsSubmit?: (data: EnhancedNodeData) => void;
  [key: string]: any;
}

export const EnhancedNode: React.FC<EnhancedNodeWrapperProps> = ({
  id, 
  data, 
  selected,
  children,
  showContextMenu,
  onSettingsSubmit,
  ...reactFlowProps
}) => {
  return (
    <EnhancedBaseNode
      id={id}
      data={data}
      selected={selected}
      showContextMenu={showContextMenu}
      onSettingsSubmit={onSettingsSubmit}
    >
      {children}
    </EnhancedBaseNode>
  );
};

export default EnhancedNode;