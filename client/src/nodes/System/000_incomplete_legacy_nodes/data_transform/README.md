# Data Transform Node

## Overview
The Data Transform node allows for manipulation and transformation of JSON data structures using JavaScript expressions. It provides a powerful way to filter, map, and process structured data within workflows.

## Inputs
- `data`: The input data object to transform

## Outputs
- `result`: The transformed data result
- `error`: Error message if transformation fails

## Parameters
- `transformation`: JavaScript code to transform the input data
- `mode`: The transformation mode (map, filter, or custom)

## Transformation Modes

### Map Mode
The map mode allows you to transform each item in an array. Your code should return the transformed item.

```javascript
// Input: { data: [1, 2, 3, 4, 5] }
// Transformation: return item * 2;
// Result: { result: [2, 4, 6, 8, 10] }
```

### Filter Mode
The filter mode allows you to filter items in an array. Your code should return a boolean value.

```javascript
// Input: { data: [1, 2, 3, 4, 5] }
// Transformation: return item > 2;
// Result: { result: [3, 4, 5] }
```

### Custom Mode
The custom mode gives you full control over the transformation. Your code should operate on the `data` variable and return the final result.

```javascript
// Input: { data: { users: [{ name: 'Alice' }, { name: 'Bob' }] } }
// Transformation: return data.users.map(user => ({ ...user, active: true }));
// Result: { result: [{ name: 'Alice', active: true }, { name: 'Bob', active: true }] }
```

## Error Handling
The node returns an error output in the following cases:
- When the input data is not valid
- When the transformation code contains syntax errors
- When the transformation execution fails due to runtime errors

## Implementation Details
The data transform node uses JavaScript's Function constructor to dynamically evaluate the transformation code against the input data. It includes safeguards to prevent infinite loops and excessive memory usage during transformation.