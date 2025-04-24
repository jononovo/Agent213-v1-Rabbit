/**
 * Company Search Node Definition
 * 
 * This node searches for company information based on input criteria.
 */

import { NodeDefinition } from '@/nodes/types';

export const defaultData = {
  prompt: 'Find information about tech companies in the United States with 50-200 employees',
  includeIndustry: true,
  includeEmployeeCount: true,
  includeRevenue: true,
  includeFunding: true,
  includeDescription: true,
  maxResults: 5
};

export const definition: NodeDefinition = {
  type: 'company_search',
  name: 'Company Search',
  description: 'Searches for company information based on provided criteria',
  icon: 'Building',
  category: 'lead_generation',
  version: '1.0.0',
  inputs: {
    query: {
      type: 'string',
      description: 'Search query or criteria for finding companies'
    },
    filters: {
      type: 'object',
      description: 'Additional filters to apply (optional)',
      optional: true
    }
  },
  outputs: {
    companies: {
      type: 'array',
      description: 'List of companies matching the search criteria'
    },
    metadata: {
      type: 'object',
      description: 'Search metadata and statistics',
      optional: true
    }
  },
  defaultData
};

export default definition;