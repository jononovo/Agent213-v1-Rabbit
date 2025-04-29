/**
 * Node Test Loader
 * 
 * A utility module to dynamically load test modules for different node types.
 * This approach centralizes test loading and makes it easy to add tests for new nodes.
 */
import { NodeTest } from '../nodes/types/nodeTestsStandard';

// We'll initialize this lazily to avoid circular imports
let nodeTestRegistry: Record<string, NodeTest[]> | null = null;

// Function to initialize the registry
const initTestRegistry = async (): Promise<Record<string, NodeTest[]>> => {
  if (nodeTestRegistry !== null) {
    return nodeTestRegistry;
  }
  
  // Create a new registry
  nodeTestRegistry = {};
  
  try {
    // Attempt to load send_to_webhook tests
    try {
      const sendToWebhookModule = await import('../nodes/System/send_to_webhook/tests');
      if (sendToWebhookModule.default) {
        nodeTestRegistry['send_to_webhook'] = sendToWebhookModule.default;
      }
    } catch (e) {
      console.warn('Could not load send_to_webhook tests:', e);
    }
    
    // Attempt to load text_formatter tests
    try {
      const textFormatterModule = await import('../nodes/System/text_formatter/tests');
      if (textFormatterModule.default) {
        nodeTestRegistry['text_formatter'] = textFormatterModule.default;
      }
    } catch (e) {
      console.warn('Could not load text_formatter tests:', e);
    }
    
    // Attempt to load http_request tests
    try {
      const httpRequestModule = await import('../nodes/Integration/http_request/tests');
      if (httpRequestModule.default) {
        nodeTestRegistry['http_request'] = httpRequestModule.default;
      }
    } catch (e) {
      console.warn('Could not load http_request tests:', e);
    }
    
    // Attempt to load perplexity_api tests
    try {
      const perplexityApiModule = await import('../nodes/Integration/perplexity_api/tests');
      if (perplexityApiModule.default) {
        nodeTestRegistry['perplexity_api'] = perplexityApiModule.default;
      }
    } catch (e) {
      console.warn('Could not load perplexity_api tests:', e);
    }
    
    return nodeTestRegistry;
  } catch (e) {
    console.error('Error initializing test registry:', e);
    return {};
  }
};

/**
 * Loads test modules for a given node type
 * @param nodeType - The type of node to load tests for
 * @returns Array of tests if found, null otherwise
 */
export const loadNodeTests = async (nodeType: string): Promise<NodeTest[] | null> => {
  try {
    // Initialize registry if needed
    const registry = await initTestRegistry();
    
    // Check if we have registered tests for this node type
    if (nodeType in registry) {
      const tests = registry[nodeType];
      console.log(`Loaded ${tests.length} tests for ${nodeType} from registry`);
      return tests;
    }
    
    // No tests found for this node type
    console.warn(`No tests found for node type: ${nodeType}`);
    return null;
  } catch (error) {
    console.error(`Error loading tests for node type ${nodeType}:`, error);
    return null;
  }
};

/**
 * Returns a list of node types that have tests available
 */
export const getNodeTypesWithTests = async (): Promise<string[]> => {
  const registry = await initTestRegistry();
  return Object.keys(registry || {});
};

/**
 * Returns the number of tests available for a given node type
 */
export const getTestCountForNodeType = async (nodeType: string): Promise<number> => {
  const registry = await initTestRegistry();
  if (registry && nodeType in registry && registry[nodeType]) {
    return registry[nodeType].length;
  }
  return 0;
};