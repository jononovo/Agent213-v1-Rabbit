/**
 * Base Node Template Tests
 * 
 * This file contains basic tests for the base node template.
 * Replace this comment with a description of your node's test cases.
 */

import { NodeTest } from '@/lib/nodeTestLoader';
import { executor } from './executor';
import { definition } from './definition';

// Define basic node tests
const tests: NodeTest[] = [
  {
    name: 'should pass through input data',
    executor,
    definition,
    input: {
      input: [
        {
          json: { testProperty: 'testValue' }
        }
      ]
    },
    expected: {
      output: [
        {
          json: { testProperty: 'testValue' }
        }
      ]
    }
  },
  {
    name: 'should handle empty input',
    executor,
    definition,
    input: {
      input: []
    },
    expected: {
      output: [
        {
          json: { message: 'No input data received' }
        }
      ]
    }
  }
];

export default tests;