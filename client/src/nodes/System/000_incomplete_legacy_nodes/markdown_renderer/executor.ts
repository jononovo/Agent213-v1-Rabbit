/**
 * Markdown Renderer Node Executor
 * 
 * This file contains the logic for executing the markdown renderer node.
 * It processes markdown text, generates HTML, and extracts metadata.
 */

import { createNodeOutput, createErrorOutput } from '../../../nodes/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface MarkdownRendererNodeData {
  defaultMarkdown: string;
  renderHeadings: boolean;
  renderLists: boolean;
  renderLinks: boolean;
  renderImages: boolean;
  extractFrontmatter: boolean;
}

// Simple markdown to HTML converter
// In a real implementation, you'd use a library like marked or remark
function convertMarkdownToHtml(
  markdown: string,
  options: {
    renderHeadings: boolean;
    renderLists: boolean;
    renderLinks: boolean;
    renderImages: boolean;
  }
): string {
  let html = markdown;
  
  // Handle frontmatter block (if any)
  html = html.replace(/^---\s*\n([\s\S]*?)\n---\s*\n/, '');
  
  // Headings
  if (options.renderHeadings) {
    html = html
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  }
  
  // Bold and Italic
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
    
  // Lists
  if (options.renderLists) {
    // Unordered lists
    html = html.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
    
    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, '<ol>$&</ol>');
  }
  
  // Links
  if (options.renderLinks) {
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }
  
  // Images
  if (options.renderImages) {
    html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  }
  
  // Line breaks
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

// Extract plaintext from markdown
function extractPlainText(markdown: string): string {
  // Remove frontmatter
  let text = markdown.replace(/^---\s*\n([\s\S]*?)\n---\s*\n/, '');
  
  // Remove headings
  text = text.replace(/^#+\s+(.*$)/gm, '$1');
  
  // Remove bold/italic
  text = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1');
  
  // Remove list markers
  text = text
    .replace(/^\s*\*\s+(.*)/gm, '$1')
    .replace(/^\s*\d+\.\s+(.*)/gm, '$1');
  
  // Replace links with text only
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  
  // Remove images
  text = text.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '');
  
  return text;
}

// Count words in text
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.trim() !== '').length;
}

// Extract frontmatter
function extractFrontmatter(markdown: string): Record<string, any> {
  const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  
  if (!frontmatterMatch) {
    return {};
  }
  
  const frontmatter = frontmatterMatch[1];
  const metadata: Record<string, any> = {};
  
  // Parse YAML-style key-value pairs
  frontmatter.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      metadata[key.trim()] = value.trim();
    }
  });
  
  return metadata;
}

// Extract metadata from markdown
function extractMetadata(markdown: string, shouldExtractFrontmatter: boolean): Record<string, any> {
  const metadata: Record<string, any> = {
    headings: [],
    links: [],
    images: []
  };
  
  // Extract frontmatter if enabled
  if (shouldExtractFrontmatter) {
    metadata.frontmatter = extractFrontmatter(markdown);
  }
  
  // Extract headings
  const headingRegex = /^(#+)\s+(.*$)/gm;
  const headingMatches: RegExpExecArray[] = [];
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(markdown)) !== null) {
    headingMatches.push(headingMatch);
  }
  
  metadata.headings = headingMatches.map(match => ({
    level: match[1].length,
    text: match[2].trim()
  }));
  
  // Extract links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkMatches: RegExpExecArray[] = [];
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(markdown)) !== null) {
    linkMatches.push(linkMatch);
  }
  
  metadata.links = linkMatches.map(match => ({
    text: match[1],
    url: match[2]
  }));
  
  // Extract images
  const imageRegex = /!\[([^\]]+)\]\(([^)]+)\)/g;
  const imageMatches: RegExpExecArray[] = [];
  let imageMatch: RegExpExecArray | null;
  while ((imageMatch = imageRegex.exec(markdown)) !== null) {
    imageMatches.push(imageMatch);
  }
  
  metadata.images = imageMatches.map(match => ({
    alt: match[1],
    src: match[2]
  }));
  
  return metadata;
}

export const execute = async (
  nodeData: MarkdownRendererNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get markdown content, either from input or default
    const markdownContent = (inputs && inputs.markdown) 
      ? inputs.markdown 
      : nodeData.defaultMarkdown;
    
    if (!markdownContent) {
      return createErrorOutput('No markdown content provided', 'markdown_renderer');
    }
    
    // Process any variables if provided
    let processedMarkdown = markdownContent;
    
    if (inputs && inputs.variables && typeof inputs.variables === 'object') {
      // Simple variable interpolation with {{varName}} syntax
      processedMarkdown = markdownContent.replace(
        /\{\{([^}]+)\}\}/g,
        (match: string, varName: string) => {
          const name = varName.trim();
          return inputs.variables[name] !== undefined 
            ? String(inputs.variables[name]) 
            : match;
        }
      );
    }
    
    // Convert markdown to HTML
    const html = convertMarkdownToHtml(processedMarkdown, {
      renderHeadings: nodeData.renderHeadings,
      renderLists: nodeData.renderLists,
      renderLinks: nodeData.renderLinks,
      renderImages: nodeData.renderImages
    });
    
    // Extract plain text
    const plainText = extractPlainText(processedMarkdown);
    
    // Count words
    const wordCount = countWords(plainText);
    
    // Extract metadata
    const metadata = extractMetadata(processedMarkdown, nodeData.extractFrontmatter);
    
    // Create output
    const output = {
      html,
      plainText,
      wordCount,
      metadata
    };
    
    // Return standardized output
    return createNodeOutput(output, {
      startTime,
      additionalMeta: {
        renderedElements: {
          headings: nodeData.renderHeadings,
          lists: nodeData.renderLists,
          links: nodeData.renderLinks,
          images: nodeData.renderImages
        }
      }
    });
  } catch (error: any) {
    console.error('Error in markdown_renderer executor:', error);
    return createErrorOutput(
      error.message || 'Error rendering markdown',
      'markdown_renderer'
    );
  }
};