# Perplexity API Node

The Perplexity API Node allows you to integrate Perplexity's powerful AI models directly into your workflows.

## Overview

This node connects to the Perplexity AI API to generate text responses based on input prompts. It offers customizable settings such as model selection, temperature control, and maximum token limits.

## Prerequisites

- A Perplexity AI API key (obtain from [https://docs.perplexity.ai/](https://docs.perplexity.ai/))
- The API key should be added to the node settings before use

## Inputs

| Input | Type | Description | Required |
|-------|------|-------------|----------|
| `prompt` | string | The text prompt to send to Perplexity | Yes |
| `system` | string | System instructions that control the behavior of the AI | No |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `response` | string | The generated text response from Perplexity |
| `metadata` | object | Response metadata including token usage statistics |

## Settings

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Model | The Perplexity AI model to use | `llama-3.1-sonar-small-128k-online` |
| API Key | Your Perplexity API key | `""` (empty) |
| Temperature | Controls randomness (0-1) | `0.7` |
| Max Tokens | Maximum number of tokens to generate | `1000` |
| Use System Prompt | Enable/disable system prompt input | `false` |
| System Prompt | Instructions for the AI assistant | `"You are a helpful AI assistant."` |

## Models

### Available Models
- **Llama 3.1 Sonar Small** - Fast, efficient model for general tasks
- **Llama 3.1 Sonar Large** - More powerful model with improved capabilities
- **Llama 3.1 Sonar Huge** - Highest capability model for complex tasks
- **PPLX 7B** - Compact model for basic tasks
- **PPLX 70B** - Larger model with greater capabilities
- **Mistral 7B Instruct** - Optimized for instruction following
- **Llama 2 70B Chat** - Optimized for conversational contexts
- **Mixtral 8x7B Instruct** - Mixture of experts architecture for diverse tasks

## Usage Examples

### Basic Text Generation

Connect a Text Input node with a prompt to the Perplexity API node, then connect the response to an output node:

1. Add a Text Input node and enter your prompt
2. Connect the Text Input to the Perplexity API node's `prompt` input
3. Connect the Perplexity API's `response` output to a Text Output node
4. Configure the Perplexity API node with your API key and desired settings

### Using System Instructions

For more controlled outputs:

1. Add a Text Input node for your system instructions (e.g., "Answer as a helpful tutor")
2. Add another Text Input node for your prompt
3. Connect the system instructions to the `system` input
4. Connect the prompt to the `prompt` input
5. Enable "Use System Prompt" in the node settings
6. Connect the `response` output to your desired destination

## Tips for Best Results

- **Lower temperature** (0.1-0.3) for more focused, deterministic responses
- **Higher temperature** (0.7-1.0) for more creative, varied responses
- Use system instructions to set the tone and context of the response
- For complex tasks, use the larger models (Llama 3.1 Sonar Large/Huge)
- For faster responses with lower latency, use the smaller models

## Troubleshooting

- **Empty or error responses**: Check that your API key is valid and entered correctly
- **Rate limit errors**: Your account may have exceeded its API quota
- **Strange or incomplete responses**: Try adjusting your prompt or decreasing the max tokens setting
- **Missing context**: Include more details in your prompt or use system instructions

## Pricing and Usage Considerations

Perplexity AI has a tiered pricing structure based on the model used and tokens consumed. Check the [Perplexity AI pricing page](https://docs.perplexity.ai/pricing) for current rates.

The node displays token usage information in the metadata output to help you monitor your usage.