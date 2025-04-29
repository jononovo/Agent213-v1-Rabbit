/**
 * Node Test Loader
 * 
 * A utility module to dynamically load test modules for different node types.
 * This approach centralizes test loading and eliminates the need for hardcoding test imports.
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
  
  return nodeTestRegistry;
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
      console.log(`Loaded ${tests.length} tests for ${nodeType} from registry cache`);
      return tests;
    }
    
    // Otherwise try to dynamically import tests for this node type
    try {
      // First try Integration category
      try {
        // @vite-ignore
        const testsModule = await import(`../nodes/Integration/${nodeType}/tests.ts`);
        if (testsModule.default) {
          // Cache the result
          registry[nodeType] = testsModule.default;
          console.log(`Loaded ${testsModule.default.length} tests for ${nodeType} from Integration folder`);
          return testsModule.default;
        }
      } catch (e) {
        // Not found in Integration category, try System category
        try {
          // @vite-ignore
          const testsModule = await import(`../nodes/System/${nodeType}/tests.ts`);
          if (testsModule.default) {
            // Cache the result
            registry[nodeType] = testsModule.default;
            console.log(`Loaded ${testsModule.default.length} tests for ${nodeType} from System folder`);
            return testsModule.default;
          }
        } catch (e) {
          // Not found in System category, try Custom category
          try {
            // @vite-ignore
            const testsModule = await import(`../nodes/Custom/${nodeType}/tests.ts`);
            if (testsModule.default) {
              // Cache the result
              registry[nodeType] = testsModule.default;
              console.log(`Loaded ${testsModule.default.length} tests for ${nodeType} from Custom folder`);
              return testsModule.default;
            }
          } catch (e) {
            // No tests found for this node type in any category
            console.warn(`No tests found for node type: ${nodeType}`);
            return null;
          }
        }
      }
    } catch (importError) {
      console.warn(`Error importing tests for node type ${nodeType}:`, importError);
      return null;
    }
    
    // No tests found
    return null;
  } catch (error) {
    console.error(`Error loading tests for node type ${nodeType}:`, error);
    return null;
  }
};

/**
 * Returns a list of node types that have tests available
 * This implementation only returns what's already in the registry.
 * For a full scan of all available node types with tests, use scanForNodeTests.
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