/**
 * Markdown Renderer Node UI Component
 * 
 * This file contains the React component used to render the markdown renderer node
 * in the workflow editor, with a Simple AI Dev inspired UI featuring live preview.
 */

import React, { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileCode, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LabeledHandle } from '@/components/ui/labeled-handle';

// Default data for the node
export const defaultData = {
  defaultMarkdown: '# Hello World\n\nThis is a **markdown** sample.',
  renderHeadings: true,
  renderLists: true,
  renderLinks: true,
  renderImages: true,
  extractFrontmatter: false,
  label: 'Markdown Renderer',
  markdownSource: 'default', // 'default' or 'input'
  wordCount: 0,
  activeTab: 'editor'
};

// Simple markdown to HTML converter for preview
// In a real implementation, you'd use a library like marked or remark
function simpleMarkdownToHtml(markdown: string): string {
  return markdown
    // Headings
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Line breaks
    .replace(/\n/g, '<br />');
}

// Count words in text
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.trim() !== '').length;
}

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state
  const [markdown, setMarkdown] = useState<string>(
    nodeData.defaultMarkdown || defaultData.defaultMarkdown
  );
  
  const [renderHeadings, setRenderHeadings] = useState<boolean>(
    nodeData.renderHeadings ?? defaultData.renderHeadings
  );
  
  const [renderLists, setRenderLists] = useState<boolean>(
    nodeData.renderLists ?? defaultData.renderLists
  );
  
  const [renderLinks, setRenderLinks] = useState<boolean>(
    nodeData.renderLinks ?? defaultData.renderLinks
  );
  
  const [renderImages, setRenderImages] = useState<boolean>(
    nodeData.renderImages ?? defaultData.renderImages
  );
  
  const [extractFrontmatter, setExtractFrontmatter] = useState<boolean>(
    nodeData.extractFrontmatter ?? defaultData.extractFrontmatter
  );
  
  const [markdownSource, setMarkdownSource] = useState<string>(
    nodeData.markdownSource || defaultData.markdownSource
  );
  
  const [wordCount, setWordCount] = useState<number>(
    nodeData.wordCount || defaultData.wordCount
  );
  
  const [activeTab, setActiveTab] = useState<string>(
    nodeData.activeTab || defaultData.activeTab
  );
  
  // Update local state when node data changes
  useEffect(() => {
    if (nodeData.defaultMarkdown !== undefined) setMarkdown(nodeData.defaultMarkdown);
    if (nodeData.renderHeadings !== undefined) setRenderHeadings(nodeData.renderHeadings);
    if (nodeData.renderLists !== undefined) setRenderLists(nodeData.renderLists);
    if (nodeData.renderLinks !== undefined) setRenderLinks(nodeData.renderLinks);
    if (nodeData.renderImages !== undefined) setRenderImages(nodeData.renderImages);
    if (nodeData.extractFrontmatter !== undefined) setExtractFrontmatter(nodeData.extractFrontmatter);
    if (nodeData.markdownSource !== undefined) setMarkdownSource(nodeData.markdownSource);
    if (nodeData.wordCount !== undefined) setWordCount(nodeData.wordCount);
    if (nodeData.activeTab !== undefined) setActiveTab(nodeData.activeTab);
  }, [nodeData]);
  
  // Calculate word count when markdown changes
  useEffect(() => {
    setWordCount(countWords(markdown));
  }, [markdown]);
  
  // Callback for updating node data
  const updateNodeData = (updates: Record<string, any>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        ...updates
      });
    }
  };
  
  // Handle markdown change
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMarkdown(newValue);
    updateNodeData({ 
      defaultMarkdown: newValue,
      wordCount: countWords(newValue)
    });
  };
  
  // Handle option toggle
  const handleOptionToggle = (option: string, checked: boolean) => {
    switch(option) {
      case 'renderHeadings':
        setRenderHeadings(checked);
        break;
      case 'renderLists':
        setRenderLists(checked);
        break;
      case 'renderLinks':
        setRenderLinks(checked);
        break;
      case 'renderImages':
        setRenderImages(checked);
        break;
      case 'extractFrontmatter':
        setExtractFrontmatter(checked);
        break;
    }
    
    updateNodeData({ [option]: checked });
  };
  
  // Generate HTML preview
  const htmlPreview = simpleMarkdownToHtml(markdown);
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[280px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          <FileText size={16} />
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'Markdown Renderer'}</div>
        <Badge variant="outline" className="ml-auto text-xs">
          {wordCount} words
        </Badge>
        <Badge 
          variant={markdownSource === 'input' ? 'secondary' : 'outline'} 
          className="ml-1 text-xs"
        >
          {markdownSource === 'input' ? 'Live' : 'Default'}
        </Badge>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            <TabsTrigger value="options" className="text-xs">Options</TabsTrigger>
          </TabsList>
          
          {/* Editor Tab */}
          <TabsContent value="editor" className="pt-1">
            <div className="flex flex-col">
              <Label className="mb-1 block text-xs text-muted-foreground">
                Markdown Content
              </Label>
              <Textarea
                value={markdown}
                onChange={handleMarkdownChange}
                placeholder="Enter markdown text..."
                className="text-sm font-mono resize-none h-24 min-h-24"
              />
              <div className="flex justify-between mt-2">
                <div className="text-xs text-muted-foreground">
                  {wordCount} words
                </div>
                <div className="text-xs text-muted-foreground">
                  {markdown.length} chars
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="pt-1">
            <div className="border rounded-sm p-2 bg-white text-sm overflow-auto max-h-[200px] min-h-[100px]">
              <div 
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
                className="markdown-preview prose prose-sm max-w-none"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Live preview of rendered markdown
            </div>
          </TabsContent>
          
          {/* Options Tab */}
          <TabsContent value="options" className="pt-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="render-headings">
                  Render Headings
                </Label>
                <Switch
                  id="render-headings"
                  checked={renderHeadings}
                  onCheckedChange={(checked) => handleOptionToggle('renderHeadings', checked)}
                  className="scale-75"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="render-lists">
                  Render Lists
                </Label>
                <Switch
                  id="render-lists"
                  checked={renderLists}
                  onCheckedChange={(checked) => handleOptionToggle('renderLists', checked)}
                  className="scale-75"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="render-links">
                  Render Links
                </Label>
                <Switch
                  id="render-links"
                  checked={renderLinks}
                  onCheckedChange={(checked) => handleOptionToggle('renderLinks', checked)}
                  className="scale-75"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="render-images">
                  Render Images
                </Label>
                <Switch
                  id="render-images"
                  checked={renderImages}
                  onCheckedChange={(checked) => handleOptionToggle('renderImages', checked)}
                  className="scale-75"
                />
              </div>
              
              <Separator className="my-1" />
              
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="extract-frontmatter">
                  Extract Frontmatter
                </Label>
                <Switch
                  id="extract-frontmatter"
                  checked={extractFrontmatter}
                  onCheckedChange={(checked) => handleOptionToggle('extractFrontmatter', checked)}
                  className="scale-75"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Input Handles - Simplified to just 1 */}
      <LabeledHandle
        type="target"
        position={Position.Left}
        id="markdown"
        label="Markdown Input"
        isConnectable={isConnectable}
        handlePosition={0.5}
        bgColor="bg-blue-500"
      />
      
      {/* Output Handles - Simplified to just 1 */}
      <LabeledHandle
        type="source"
        position={Position.Right}
        id="html"
        label="HTML Output"
        isConnectable={isConnectable}
        handlePosition={0.5}
        bgColor="bg-green-500"
      />
    </div>
  );
};

export default component;