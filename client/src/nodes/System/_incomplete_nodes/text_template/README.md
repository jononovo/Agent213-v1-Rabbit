# Text Template Node

## Overview
The Text Template node allows for template-based text generation using variables. It provides a simple way to construct dynamic text content from input data using a template syntax.

## Inputs
- `variables`: An object containing key-value pairs to use in the template

## Outputs
- `text`: The resulting text after template variables are replaced
- `error`: Error message if template processing fails

## Parameters
- `template`: The template string with variable placeholders in the format `{{variableName}}`

## Template Syntax
The template uses a simple placeholder syntax with double curly braces:
- `{{variableName}}` - Will be replaced with the value of `variableName` from the input variables
- Text outside the curly braces is preserved as-is

## Usage Examples

### Basic Variable Replacement
```javascript
// Template: "Hello, {{name}}!"
// Input: { variables: { name: "World" } }
// Result: { text: "Hello, World!" }
```

### Multiple Variables
```javascript
// Template: "{{greeting}}, {{name}}! Welcome to {{place}}."
// Input: { variables: { greeting: "Hello", name: "John", place: "our platform" } }
// Result: { text: "Hello, John! Welcome to our platform." }
```

### Nested Object Properties
```javascript
// Template: "User: {{user.name}}, Age: {{user.age}}"
// Input: { variables: { user: { name: "Alice", age: 30 } } }
// Result: { text: "User: Alice, Age: 30" }
```

## Error Handling
The node returns an error output in the following cases:
- When required input variables are missing
- When the template syntax is invalid
- When attempting to access undefined variable properties

## Implementation Details
The text template node uses a simple string replacement algorithm that supports nested object properties and maintains the formatting of the original template.