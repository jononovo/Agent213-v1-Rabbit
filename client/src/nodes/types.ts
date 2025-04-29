/**
 * Node Types and Interfaces
 * 
 * This file defines the core types and interfaces used by nodes in the workflow system.
 * It includes definitions for nodes, interfaces, port types, and integration configurations.
 */

// Type definitions for node ports
export interface PortDefinition {
  type: string;
  description: string;
  isArray?: boolean;
  optional?: boolean;
}

// Standard node interface definition
export interface NodeInterfaceDefinition {
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
}

// Integration node capabilities
export interface IntegrationConfigProvides {
  endpoint?: boolean;
  webhook?: boolean;
  scheduler?: boolean;
  connector?: boolean;
  ai?: boolean;
  api?: boolean; // Added to support API integrations
}

// Integration node requirements
export interface IntegrationConfigRequires {
  storage?: boolean;
  authentication?: boolean;
  proxy?: boolean;
  apiKey?: string; // Added to specify API key environment variable
}

// Endpoint configuration for integration nodes
export interface IntegrationEndpointConfig {
  pathTemplate: string;
  methods: string[];
  authTypes: string[];
}

// Integration configuration for integration nodes
export interface IntegrationConfig {
  provides: IntegrationConfigProvides;
  requires: IntegrationConfigRequires;
  endpoint?: IntegrationEndpointConfig;
}

// Node definition interface
export interface NodeDefinition extends NodeInterfaceDefinition {
  type: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  version?: string;
  defaultData: Record<string, any>;
  integrationConfig?: IntegrationConfig; // Optional for standard nodes, required for integration nodes
}

// Node test result interface
export interface NodeTestResult {
  passed: boolean;
  message: string;
  error?: string;
}

// Node test interface
export interface NodeTest {
  name: string;
  description: string;
  category: string;
  run: () => Promise<NodeTestResult>;
}

// Node test suite interface
export interface NodeTestSuite {
  [key: string]: NodeTest[];
}