/**
 * CSV Processor Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../Custom/types';

export const definition: NodeDefinition = {
  type: 'csv_processor',
  name: 'CSV Processor',
  description: 'Processes CSV data with column mapping and filtering',
  icon: 'table',
  category: 'data',
  version: '1.0.0',
  inputs: {
    csvData: {
      type: 'string',
      description: 'The CSV data to process'
    },
    columnFilter: {
      type: 'array',
      description: 'Columns to include (optional)',
      optional: true
    },
    filterCriteria: {
      type: 'object',
      description: 'Filter criteria (optional)',
      optional: true
    }
  },
  outputs: {
    processedCsv: {
      type: 'string',
      description: 'The processed CSV data'
    },
    jsonData: {
      type: 'array',
      description: 'The CSV data as a JSON array'
    },
    summary: {
      type: 'object',
      description: 'Summary of the processed data'
    }
  },
  configOptions: [
    {
      key: 'hasHeader',
      type: 'boolean',
      default: true,
      description: 'Whether the CSV data has a header row'
    },
    {
      key: 'delimiter',
      type: 'string',
      default: ',',
      description: 'The delimiter used in the CSV data'
    },
    {
      key: 'trimValues',
      type: 'boolean',
      default: true,
      description: 'Trim whitespace from values'
    },
    {
      key: 'columnsToInclude',
      type: 'string',
      default: '',
      description: 'Comma-separated list of columns to include (empty = all)'
    },
    {
      key: 'filterColumn',
      type: 'string',
      default: '',
      description: 'Column to filter on'
    },
    {
      key: 'filterValue',
      type: 'string',
      default: '',
      description: 'Value to filter by'
    },
    {
      key: 'filterOperation',
      type: 'string',
      default: 'equals',
      description: 'Filter operation (equals, contains, startsWith, endsWith)'
    }
  ],
  defaultData: {
    hasHeader: true,
    delimiter: ',',
    trimValues: true,
    columnsToInclude: '',
    filterColumn: '',
    filterValue: '',
    filterOperation: 'equals',
    label: 'CSV Processor'
  }
};

export default definition;