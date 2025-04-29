# Decision Node

## Overview
The Decision node creates conditional branches in workflows based on rules. It allows workflows to follow different paths depending on the evaluation of a JavaScript expression.

## Inputs
- `value`: The data to evaluate against the condition

## Outputs
- `true`: Output if condition evaluates to true
- `false`: Output if condition evaluates to false
- `error`: Error message if the condition evaluation fails

## Parameters
- `condition`: JavaScript expression that evaluates to true or false (e.g., `value > 10`)

## Usage Examples

### Basic Condition
```javascript
// Condition: value > 10
// Input: { value: 15 }
// Result: { true: 15 }

// Input: { value: 5 }
// Result: { false: 5 }
```

### String Comparison
```javascript
// Condition: value === "hello"
// Input: { value: "hello" }
// Result: { true: "hello" }

// Input: { value: "world" }
// Result: { false: "world" }
```

### Object Property Access
```javascript
// Condition: value.count > 3
// Input: { value: { count: 5 } }
// Result: { true: { count: 5 } }

// Input: { value: { count: 2 } }
// Result: { false: { count: 2 } }
```

## Error Handling
The node returns an error output in the following cases:
- No input value is provided
- No condition is provided
- The condition contains JavaScript syntax errors
- The condition throws an error during evaluation

## Implementation Details
The decision node creates a JavaScript function at runtime to evaluate the condition. This allows for dynamic evaluation of expressions without hardcoding logic in the node itself.