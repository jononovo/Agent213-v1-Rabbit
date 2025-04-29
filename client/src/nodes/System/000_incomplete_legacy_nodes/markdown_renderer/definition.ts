/**
 * Markdown Renderer Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../Custom/types';

export const definition: NodeDefinition = {
  type: 'markdown_renderer',
  name: 'Markdown Renderer',
  description: 'Renders markdown text with live preview',
  icon: 'file-text',
  category: 'content',
  version: '1.0.0',
  inputs: {
    markdown: {
      type: 'string',
      description: 'The markdown text to render'
    },
    variables: {
      type: 'object',
      description: 'Variables to interpolate in the markdown',
      optional: true
    }
  },
  outputs: {
    html: {
      type: 'string',
      description: 'The rendered HTML'
    },
    plainText: {
      type: 'string',
      description: 'Plain text version with formatting removed'
    },
    wordCount: {
      type: 'number',
      description: 'Word count of the markdown text'
    },
    metadata: {
      type: 'object',
      description: 'Metadata extracted from the markdown'
    }
  },
  configOptions: [
    {
      key: 'defaultMarkdown',
      type: 'textarea',
      default: '# Hello World\n\nThis is a **markdown** sample.',
      description: 'Default markdown content'
    },
    {
      key: 'renderHeadings',
      type: 'boolean',
      default: true,
      description: 'Render heading elements'
    },
    {
      key: 'renderLists',
      type: 'boolean',
      default: true,
      description: 'Render list elements'
    },
    {
      key: 'renderLinks',
      type: 'boolean',
      default: true,
      description: 'Render link elements'
    },
    {
      key: 'renderImages',
      type: 'boolean',
      default: true,
      description: 'Render image elements'
    },
    {
      key: 'extractFrontmatter',
      type: 'boolean',
      default: false,
      description: 'Extract YAML frontmatter as metadata'
    }
  ],
  defaultData: {
    defaultMarkdown: '# Hello World\n\nThis is a **markdown** sample.',
    renderHeadings: true,
    renderLists: true,
    renderLinks: true,
    renderImages: true,
    extractFrontmatter: false,
    label: 'Markdown Renderer'
  }
};

export default definition;