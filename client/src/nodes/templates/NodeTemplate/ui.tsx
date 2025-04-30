/**
 * Node Template - UI Component
 * 
 * This is a template for creating custom node UI components.
 * Copy this file to create a new node and modify it to fit your needs.
 */

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from '../../ui/components/BaseNode';

interface NodeTemplateProps extends NodeProps {
  data: {
    label: string;
    parameter1?: string;
    parameter2?: number;
    parameter3?: boolean;
    [key: string]: any;
  };
  selected: boolean;
  isConnectable: boolean;
}

/**
 * NodeTemplate UI Component
 * 
 * This extends the BaseNode component with custom styling and behavior.
 * You can also create a completely custom implementation if needed.
 */
const NodeTemplateNode = (props: NodeTemplateProps) => {
  // Extract node properties
  const { data } = props;
  
  // You can add custom node behaviors here
  
  // You can customize the node appearance by passing additional props
  // to the BaseNode component or by creating a custom implementation
  
  // If your node needs custom UI for configuration, add it here
  
  return (
    <BaseNode
      {...props}
      data={{
        ...data,
        
        // You can override BaseNode properties here
        icon: 'box', // Default icon for this node
        color: '#6B46C1', // Custom color for this node
        
        // Parameters to display in the node
        parameters: {
          parameter1: data.parameter1,
          parameter2: data.parameter2,
          parameter3: data.parameter3 ? 'Yes' : 'No',
        }
      }}
    />
  );
};

export default memo(NodeTemplateNode);