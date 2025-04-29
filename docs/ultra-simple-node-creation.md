# Ultra-Simple Node Creation Guide

## Using Base Node Templates

### Standard Node

The fastest way to create a new node is to copy one of the base node templates:

1. Copy the base_node_standard template:
   ```
   cp -r client/src/nodes/Base_nodes/base_node_standard client/src/nodes/Custom/my_new_node
   ```

2. Update the node type in `definition.ts`:
   ```typescript
   // Change this
   type: 'text_input',
   
   // To this (must be unique)
   type: 'my_new_node',
   ```

3. Update node name and description:
   ```typescript
   name: 'My New Node',
   description: 'What my node does',
   ```

4. Modify input/output ports as needed:
   ```typescript
   inputs: {
     my_input: {
       type: 'string',
       description: 'My input description',
     }
   },
   
   outputs: {
     my_output: {
       type: 'string',
       description: 'My output description',
     }
   },
   ```

5. Update the executor function in `executor.ts`:
   ```typescript
   export const execute = async (
     nodeData,
     inputs = {},
   ) => {
     try {
       // Get input
       const inputValue = inputs?.my_input?.items?.[0]?.json?.text || '';
       
       // Your processing logic here
       const result = `Processed: ${inputValue}`;
       
       // Return result
       return {
         my_output: {
           items: [{ json: { text: result } }],
           meta: {
             startTime: new Date(),
             endTime: new Date()
           }
         }
       };
     } catch (error) {
       // Error handling
       return {
         my_output: {
           items: [{ json: { error: error.message } }],
           meta: {
             error: true,
             errorMessage: error.message
           }
         }
       };
     }
   };
   ```

6. Update the UI component in `ui.tsx` if needed

7. Make sure exports are correct in `index.ts`:
   ```typescript
   import { definition } from './definition';
   import { execute } from './executor';
   import { component } from './ui';
   
   export { definition, execute, component };
   export default { definition, execute, component };
   ```

### Integration Node

1. Copy the base_node_integration template:
   ```
   cp -r client/src/nodes/Base_nodes/base_node_integration client/src/nodes/Integration/my_api_node
   ```

2. Update the node type in `definition.ts`:
   ```typescript
   type: 'my_api_node',
   name: 'My API Node',
   description: 'Connects to my API',
   ```

3. Configure integration settings:
   ```typescript
   integrationConfig: {
     provides: {
       endpoint: false,  // true if node provides an endpoint
       webhook: false,   // true if node acts as webhook
     },
     requires: {
       storage: false,
       authentication: true,  // true if API needs authentication
       apiKey: 'MY_API_KEY'   // env variable for API key
     }
   }
   ```

4. Update the executor in `executor.ts`:
   ```typescript
   export const execute = async (
     nodeData,
     inputs = {},
   ) => {
     try {
       // Get input
       const inputData = inputs?.input?.items?.[0]?.json;
       
       // Make API request via Integration Engine
       const response = await makeIntegrationRequest({
         url: 'https://api.example.com/endpoint',
         method: 'POST',
         data: inputData
       });
       
       // Return result
       return {
         output: {
           items: [{ json: response }],
           meta: {
             startTime: new Date(),
             endTime: new Date()
           }
         }
       };
     } catch (error) {
       // Error handling
       return {
         output: {
           items: [{ json: { error: error.message } }],
           meta: {
             error: true,
             errorMessage: error.message
           }
         }
       };
     }
   };
   ```

5. Update exports in `index.ts`

## Adding Tests (Optional)

1. Create a `tests.ts` file with this structure:
   ```typescript
   import { NodeTest } from '@/nodes/types/nodeTestsStandard';
   
   const tests: NodeTest[] = [
     {
       name: 'Basic test',
       description: 'Tests basic functionality',
       category: 'functionality',
       run: async () => {
         try {
           // Your test code here
           return {
             passed: true,
             message: 'Test passed'
           };
         } catch (error) {
           return {
             passed: false,
             message: `Test failed: ${error.message}`
           };
         }
       }
     }
   ];
   
   export default tests;
   ```

2. Add tests to `index.ts` exports:
   ```typescript
   import tests from './tests';
   
   export { definition, execute, component, tests };
   export default { definition, execute, component, tests };
   ```