/**
 * Contact Finder Node Definition
 * 
 * This node identifies key decision makers and contacts at companies.
 */

import { NodeDefinition } from '@/nodes/types';

export const defaultData = {
  jobTitles: ['CEO', 'CTO', 'VP of Engineering', 'VP of Marketing', 'VP of Sales'],
  includeLinkedIn: true,
  includeEmail: true,
  includePhone: false,
  maxContacts: 3,
  prioritizeLeadership: true
};

export const definition: NodeDefinition = {
  type: 'contact_finder',
  name: 'Contact Finder',
  description: 'Identifies key decision makers and contacts at target companies',
  icon: 'Users',
  category: 'lead_generation',
  version: '1.0.0',
  inputs: {
    company: {
      type: 'object',
      description: 'Company information to use for contact search'
    },
    jobTitles: {
      type: 'array',
      description: 'List of job titles to target (optional)',
      optional: true
    }
  },
  outputs: {
    contacts: {
      type: 'array',
      description: 'List of identified contacts'
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