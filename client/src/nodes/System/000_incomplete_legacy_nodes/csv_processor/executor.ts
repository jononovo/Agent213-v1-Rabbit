/**
 * CSV Processor Node Executor
 * 
 * This file contains the logic for executing the CSV processor node.
 * It processes CSV data, applies filters, and provides output in various formats.
 */

import { createNodeOutput, createErrorOutput } from '../../../nodes/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface CsvProcessorNodeData {
  hasHeader: boolean;
  delimiter: string;
  trimValues: boolean;
  columnsToInclude: string;
  filterColumn: string;
  filterValue: string;
  filterOperation: string;
}

// Parse CSV to array of objects
function parseCsv(
  csvData: string,
  delimiter: string,
  hasHeader: boolean,
  trimValues: boolean
): { headers: string[], data: any[] } {
  // Split CSV into lines
  const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV data is empty');
  }
  
  // Extract headers
  let headers: string[];
  let startIndex = 0;
  
  if (hasHeader) {
    headers = lines[0].split(delimiter).map(header => 
      trimValues ? header.trim() : header
    );
    startIndex = 1;
  } else {
    // Generate numeric headers if there's no header row
    const firstRowCells = lines[0].split(delimiter);
    headers = Array.from({ length: firstRowCells.length }, (_, i) => `Column${i + 1}`);
  }
  
  // Process data rows
  const data = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(value => 
      trimValues ? value.trim() : value
    );
    
    // Skip if row has different number of cells than headers
    if (values.length !== headers.length) {
      continue;
    }
    
    // Create object with header keys and row values
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[j];
    }
    
    data.push(rowObj);
  }
  
  return { headers, data };
}

// Apply column filtering to data
function filterColumns(
  data: any[],
  columnsToInclude: string[]
): any[] {
  if (!columnsToInclude.length) {
    return data;
  }
  
  return data.map(row => {
    const filteredRow: Record<string, any> = {};
    
    for (const column of columnsToInclude) {
      if (column in row) {
        filteredRow[column] = row[column];
      }
    }
    
    return filteredRow;
  });
}

// Apply row filtering to data
function filterRows(
  data: any[],
  filterColumn: string,
  filterValue: string,
  filterOperation: string
): any[] {
  if (!filterColumn || !filterValue) {
    return data;
  }
  
  return data.filter(row => {
    if (!(filterColumn in row)) {
      return false;
    }
    
    const cellValue = row[filterColumn];
    
    switch (filterOperation) {
      case 'equals':
        return cellValue === filterValue;
      case 'contains':
        return cellValue.includes(filterValue);
      case 'startsWith':
        return cellValue.startsWith(filterValue);
      case 'endsWith':
        return cellValue.endsWith(filterValue);
      default:
        return true;
    }
  });
}

// Convert JSON data back to CSV
function jsonToCsv(
  data: any[],
  delimiter: string,
  includeHeader: boolean
): string {
  if (data.length === 0) {
    return '';
  }
  
  // Get headers from first row keys
  const headers = Object.keys(data[0]);
  
  // Create CSV lines
  const lines = [];
  
  // Add header row if needed
  if (includeHeader) {
    lines.push(headers.join(delimiter));
  }
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => 
      row[header] !== undefined && row[header] !== null ? String(row[header]) : ''
    );
    lines.push(values.join(delimiter));
  }
  
  return lines.join('\n');
}

// Generate summary of the data
function generateSummary(data: any[], headers: string[]): any {
  const rowCount = data.length;
  const columnCount = headers.length;
  
  // Generate column statistics (only for numeric columns)
  const columnStats: Record<string, any> = {};
  
  for (const header of headers) {
    // Check if column is numeric
    const numericValues = data
      .map(row => row[header])
      .filter(val => !isNaN(parseFloat(val)) && isFinite(val))
      .map(val => parseFloat(val));
    
    if (numericValues.length > 0) {
      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      const avg = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
      columnStats[header] = {
        type: 'numeric',
        min,
        max,
        avg,
        numericCount: numericValues.length
      };
    } else {
      columnStats[header] = {
        type: 'text',
        uniqueValues: new Set(data.map(row => row[header])).size
      };
    }
  }
  
  return {
    rowCount,
    columnCount,
    headers,
    columnStats
  };
}

export const execute = async (
  nodeData: CsvProcessorNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Check for CSV data
    if (!inputs || !inputs.csvData) {
      return createErrorOutput('No CSV data provided for processing', 'csv_processor');
    }
    
    const csvData = inputs.csvData;
    
    // Parse configuration
    const delimiter = nodeData.delimiter || ',';
    const hasHeader = nodeData.hasHeader;
    const trimValues = nodeData.trimValues;
    
    // Parse columns to include
    let columnsToInclude: string[] = [];
    if (nodeData.columnsToInclude) {
      columnsToInclude = nodeData.columnsToInclude
        .split(',')
        .map(col => col.trim())
        .filter(col => col !== '');
    } else if (inputs.columnFilter && Array.isArray(inputs.columnFilter)) {
      columnsToInclude = inputs.columnFilter;
    }
    
    // Parse filter criteria
    let filterColumn = nodeData.filterColumn;
    let filterValue = nodeData.filterValue;
    let filterOperation = nodeData.filterOperation || 'equals';
    
    // Override with input filter if provided
    if (inputs.filterCriteria && typeof inputs.filterCriteria === 'object') {
      const criteria = inputs.filterCriteria;
      if (criteria.column) filterColumn = criteria.column;
      if (criteria.value) filterValue = criteria.value;
      if (criteria.operation) filterOperation = criteria.operation;
    }
    
    // Parse CSV to JSON
    const { headers, data } = parseCsv(csvData, delimiter, hasHeader, trimValues);
    
    // Apply column filtering
    const columnFiltered = filterColumns(data, columnsToInclude);
    
    // Apply row filtering
    const rowFiltered = filterRows(columnFiltered, filterColumn, filterValue, filterOperation);
    
    // Generate processed CSV
    const processedCsv = jsonToCsv(rowFiltered, delimiter, hasHeader);
    
    // Generate summary
    const summary = generateSummary(rowFiltered, 
      columnsToInclude.length > 0 ? columnsToInclude : headers
    );
    
    // Create output
    const output = {
      processedCsv,
      jsonData: rowFiltered,
      summary
    };
    
    // Return standardized output
    return createNodeOutput(output, {
      startTime,
      additionalMeta: {
        originalRowCount: data.length,
        processedRowCount: rowFiltered.length,
        filterApplied: !!filterColumn && !!filterValue
      }
    });
  } catch (error: any) {
    console.error('Error in csv_processor executor:', error);
    return createErrorOutput(
      error.message || 'Error processing CSV data',
      'csv_processor'
    );
  }
};