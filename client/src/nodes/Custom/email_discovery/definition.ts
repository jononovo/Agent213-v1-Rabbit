/**
 * Email Discovery Node Definition
 * 
 * This node discovers and verifies email addresses for contacts.
 */

import { NodeDefinition } from '@/nodes/types';

export const defaultData = {
  includeVerification: true,
  useDomainPatterns: true,
  includeConfidenceScore: true,
  maxAttempts: 3,
  emailFormats: [
    "first.last@domain.com",
    "flast@domain.com",
    "firstl@domain.com",
    "first@domain.com"
  ]
};

export const definition: NodeDefinition = {
  type: 'email_discovery',
  name: 'Email Discovery',
  description: 'Discovers and verifies email addresses for contacts',
  icon: 'Mail',
  category: 'lead_generation',
  version: '1.0.0',
  inputs: {
    contact: {
      type: 'object',
      description: 'Contact information for email discovery'
    },
    domain: {
      type: 'string',
      description: 'Company domain name (optional)',
      optional: true
    }
  },
  outputs: {
    contact: {
      type: 'object',
      description: 'Contact with discovered email'
    },
    metadata: {
      type: 'object',
      description: 'Discovery metadata and verification status',
      optional: true
    }
  },
  defaultData
};

export default definition;