/**
 * Agent Trigger Node UI Component
 * 
 * This component renders the agent trigger node in the workflow editor.
 */

import React, { useState, useEffect } from 'react';
import { User, LayoutDashboard } from 'lucide-react';
import { BaseNode } from '@/nodes/core/base';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';

interface Agent {
  id: number;
  name: string;
  type: string;
}

export default function AgentTriggerNode({ id, data }: { id: string, data: any }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Fetch available agents
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
    }
  });
  
  // Update selected agent when data.agentId changes or agents are loaded
  useEffect(() => {
    if (agents && agents.length > 0 && data.agentId) {
      const agent = agents.find(a => a.id.toString() === data.agentId.toString());
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [agents, data.agentId]);
  
  // Content to show inside the node
  const nodeContent = (
    <div className="px-3 py-2">
      <div className="flex flex-col gap-2">
        {selectedAgent ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedAgent.name}</span>
            <Badge variant="outline" className="ml-auto">{selectedAgent.type}</Badge>
          </div>
        ) : (
          <Alert>
            <AlertDescription className="text-xs">
              Please select an agent in the node settings
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LayoutDashboard className="h-3 w-3" />
          <span>Mode: {data.triggerMode || 'automatic'}</span>
        </div>
      </div>
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        hideInputHandles: true, // No inputs for trigger nodes
        type: 'agent_trigger',
        icon: 'user', // Explicitly set the icon
        childrenContent: nodeContent, // Use childrenContent instead of children
        // Pass through note properties
        note: data.note,
        showNote: data.showNote
      }}
    />
  );
}