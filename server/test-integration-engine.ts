/**
 * Test script for Integration Engine
 * 
 * This script demonstrates the enhanced Integration Engine capabilities
 * with autonomous integration nodes
 */
import fetch from 'node-fetch';
import { log } from './vite';
import { integrationEngine } from './services/integrationEngine';

async function testIntegrationEngine() {
  log('Testing Integration Engine capabilities...', 'test');
  
  try {
    // 1. Register a test node type handler
    await integrationEngine.registerNodeType(
      'test_integration_node',
      {
        pathTemplate: 'test/:param',
        methods: ['GET', 'POST'],
        description: 'Test integration node',
        nodeTypeHandler: async (req, res, params) => {
          log(`Test node handler called with params: ${JSON.stringify(params)}`, 'test');
          
          res.json({
            success: true,
            message: 'Test integration node handler executed successfully',
            params,
            body: req.body,
            method: req.method,
            timestamp: new Date().toISOString()
          });
        }
      }
    );
    
    log('Registered test integration node type', 'test');
    
    // 2. List all registered node types
    const nodeTypes = await integrationEngine.getNodeTypes();
    log(`Registered node types: ${JSON.stringify(nodeTypes)}`, 'test');
    
    // Wait for node type registration to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Test the node type handler with a GET request
    log('Making GET request to test integration endpoint...', 'test');
    
    const baseUrl = `http://localhost:5000/api/integration`;
    const getResponse = await fetch(`${baseUrl}/test/testParam1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const getResponseData = await getResponse.json();
    log(`GET response: ${JSON.stringify(getResponseData)}`, 'test');
    
    // 4. Test the node type handler with a POST request
    log('Making POST request to test integration endpoint...', 'test');
    
    const postResponse = await fetch(`${baseUrl}/test/testParam2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'Test data',
        timestamp: new Date().toISOString()
      })
    });
    
    const postResponseData = await postResponse.json();
    log(`POST response: ${JSON.stringify(postResponseData)}`, 'test');
    
    // 5. Unregister the test node type
    const unregistered = await integrationEngine.unregisterNodeType('test_integration_node');
    log(`Unregistered test node type: ${unregistered}`, 'test');
    
    log('Integration Engine test completed successfully', 'test');
  } catch (error) {
    log(`Error testing Integration Engine: ${error}`, 'error');
  }
}

// Run the test if executed directly
if (require.main === module) {
  testIntegrationEngine();
}

export { testIntegrationEngine };