/**
 * Workflow Import Utility
 * 
 * This script helps import the predefined lead generation workflows into the system.
 */

import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Import workflow configurations
import companySearchWorkflow from '../workflows/company_search_workflow.json';
import contactFinderWorkflow from '../workflows/contact_finder_workflow.json';
import emailDiscoveryWorkflow from '../workflows/email_discovery_workflow.json';
import masterWorkflow from '../workflows/lead_generation_master_workflow.json';

// Track created workflow IDs
let workflowIds: Record<string, number> = {};

/**
 * Import all lead generation workflows
 */
export async function importLeadGenerationWorkflows() {
  try {
    // Step 1: Create the Company Search workflow
    const companySearchResult = await createWorkflow(companySearchWorkflow);
    workflowIds.companySearch = companySearchResult.id;
    
    // Step 2: Create the Contact Finder workflow
    const contactFinderResult = await createWorkflow(contactFinderWorkflow);
    workflowIds.contactFinder = contactFinderResult.id;
    
    // Step 3: Create the Email Discovery workflow
    const emailDiscoveryResult = await createWorkflow(emailDiscoveryWorkflow);
    workflowIds.emailDiscovery = emailDiscoveryResult.id;
    
    // Step 4: Create the Master workflow and link everything together
    const linkedMasterWorkflow = linkWorkflows(masterWorkflow, workflowIds);
    const masterResult = await createWorkflow(linkedMasterWorkflow);
    workflowIds.master = masterResult.id;
    
    // Success message
    toast({
      title: 'Lead Generation Workflows Imported',
      description: `Created ${Object.keys(workflowIds).length} workflows successfully.`,
      variant: 'default',
    });
    
    return workflowIds;
  } catch (error) {
    console.error('Error importing workflows:', error);
    toast({
      title: 'Import Failed',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: 'destructive',
    });
    
    throw error;
  }
}

/**
 * Create a new workflow
 */
async function createWorkflow(workflow: any): Promise<any> {
  const response = await apiRequest('POST', '/api/workflows', {
    name: workflow.name,
    description: workflow.description,
    type: 'custom',
    status: 'active',
    flowData: {
      nodes: workflow.nodes,
      edges: workflow.edges
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create workflow: ${errorData.message || response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Link workflows together by setting workflowId references
 */
function linkWorkflows(masterWorkflow: any, workflowIds: Record<string, number>): any {
  // Create a deep copy to avoid mutating the original
  const workflow = JSON.parse(JSON.stringify(masterWorkflow));
  
  // Update workflow trigger nodes with their target workflow IDs
  workflow.nodes.forEach((node: any) => {
    if (node.type === 'embed_other_workflow') {
      if (node.data.label?.includes('Company Search')) {
        node.data.workflowId = workflowIds.companySearch;
      } else if (node.data.label?.includes('Contact Finder')) {
        node.data.workflowId = workflowIds.contactFinder;
      } else if (node.data.label?.includes('Email Discovery')) {
        node.data.workflowId = workflowIds.emailDiscovery;
      }
    }
  });
  
  return workflow;
}