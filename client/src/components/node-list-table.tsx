import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface NodeType {
  type: string;
  name: string;
  category: string;
  status?: 'validated' | 'partial' | 'failed' | 'pending';
  testResults?: any[];
  customTestResults?: any[];
  customFolder?: string;
}

interface NodeListTableProps {
  nodes: NodeType[];
  selectedNode: NodeType | null;
  onNodeSelect: (node: NodeType) => void;
  emptyMessage?: string;
}

// Helper function to get status badge color
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'validated': return 'bg-green-100 text-green-800 border-green-300';
    case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'failed': return 'bg-red-100 text-red-800 border-red-300';
    case 'pending': 
    default: return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};



const NodeListTable: React.FC<NodeListTableProps> = ({ 
  nodes, 
  selectedNode, 
  onNodeSelect,
  emptyMessage = "No nodes found matching your criteria"
}) => {
  // Helper to render test results summary
  const renderTestResults = (node: NodeType) => {
    // If no tests have been run yet
    if (!node.testResults && !node.customTestResults) {
      return <span className="text-slate-400">No tests run</span>;
    }
    
    // Count passed standard tests
    const standardPassed = node.testResults ? 
      node.testResults.filter(test => test.status === 'passed').length : 0;
    const standardTotal = node.testResults ? node.testResults.length : 0;
    
    // Count passed custom tests
    const customPassed = node.customTestResults ? 
      node.customTestResults.filter(test => test.status === 'passed').length : 0;
    const customTotal = node.customTestResults ? node.customTestResults.length : 0;
    
    // Get color based on pass ratio
    const getResultColor = (passed: number, total: number) => {
      if (total === 0) return 'text-slate-400';
      const ratio = passed / total;
      if (ratio === 1) return 'text-green-600';
      if (ratio >= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    };
    
    // Calculate standard test badge color
    const standardColor = getResultColor(standardPassed, standardTotal);
    
    // Calculate custom test badge color
    const customColor = getResultColor(customPassed, customTotal);
    
    return (
      <div className="flex flex-col gap-1">
        {standardTotal > 0 && (
          <div className="flex items-center gap-1">
            <span className={`font-mono text-xs ${standardColor}`}>
              {standardPassed}/{standardTotal}
            </span>
            <span className="text-xs text-slate-500">std</span>
          </div>
        )}
        
        {customTotal > 0 && (
          <div className="flex items-center gap-1">
            <span className={`font-mono text-xs ${customColor}`}>
              {customPassed}/{customTotal}
            </span>
            <span className="text-xs text-slate-500">custom</span>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 text-xs font-medium text-slate-500 border-b">
        <div className="col-span-3">NAME</div>
        <div className="col-span-3">TYPE</div>
        <div className="col-span-2">CATEGORY</div>
        <div className="col-span-2">STATUS</div>
        <div className="col-span-2">TEST RESULTS</div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y">
        {nodes.length > 0 ? (
          nodes.map((node) => (
            <div 
              key={node.type} 
              className={`grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
              onClick={() => onNodeSelect(node)}
            >
              <div className="col-span-3 font-medium truncate">{node.name}</div>
              <div className="col-span-3 text-sm text-slate-500 truncate">{node.type}</div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">{node.category}</Badge>
              </div>
              <div className="col-span-2">
                <Badge className={`${getStatusColor(node.status)} border text-xs`}>
                  {node.status || 'pending'}
                </Badge>
              </div>
              <div className="col-span-2 text-sm">
                {renderTestResults(node)}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">
            <AlertTriangle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeListTable;