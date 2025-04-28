import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Loader2 } from 'lucide-react';

interface LoadingNodeData {
  label?: string;
  description?: string;
  actualType?: string;
  actualData?: any;
}

/**
 * LoadingNode - A minimal spinner placeholder shown while the actual node component is being loaded
 * 
 * This is a simplified version that shows just a spinner instead of a full node mockup
 * to avoid UI inconsistency during loading.
 */
function LoadingNode({ data, selected }: NodeProps<LoadingNodeData>) {
  const {
    label = 'Loading...',
    actualType = ''
  } = data || {};

  return (
    <div className={`
      flex items-center justify-center
      w-48 h-24 rounded-md
      ${selected ? 'border border-primary/50' : 'border border-dashed border-muted'}
      bg-background/50 backdrop-blur-sm
    `}>
      <div className="flex flex-col items-center gap-2 text-center">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <div className="text-xs text-muted-foreground font-medium">
          {label}
          {actualType && <span className="text-xs opacity-70 block">{actualType}</span>}
        </div>
      </div>
    </div>
  );
}

export default memo(LoadingNode);