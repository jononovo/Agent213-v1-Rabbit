/**
 * Base Node
 * 
 * This file provides the BaseNode component that serves as a wrapper
 * for all other node components, ensuring consistent UI and functionality.
 * This component replaces the original BaseNode from the Base folder.
 */

import React from 'react';
import { NodeProps } from 'reactflow';

// Import the BaseNode implementation from the Base folder
// This is a temporary solution until all nodes are migrated
import { BaseNode as OriginalBaseNode } from '@/nodes/Base';

// We're simply re-exporting the original BaseNode for now
// This allows us to gradually migrate nodes without breaking existing functionality
const BaseNode = (props: any) => {
  return <OriginalBaseNode {...props} />;
};

export default BaseNode;
export { BaseNode };