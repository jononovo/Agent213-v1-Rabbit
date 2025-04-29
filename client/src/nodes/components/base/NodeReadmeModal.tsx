import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface NodeReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeType: string | null;
}

const NodeReadmeModal: React.FC<NodeReadmeModalProps> = ({
  isOpen,
  onClose,
  nodeType,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch README content when the modal opens and nodeType changes
  useEffect(() => {
    if (isOpen && nodeType) {
      setIsLoading(true);
      setError(null);

      // Attempt to fetch the README content
      fetchReadmeContent(nodeType)
        .then((content) => {
          setContent(content);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching README:', err);
          setError('Could not load documentation for this node.');
          setIsLoading(false);
        });
    }
  }, [isOpen, nodeType]);

  // Function to fetch README content based on node type
  const fetchReadmeContent = async (type: string): Promise<string> => {
    try {
      // Create paths to try
      const paths = [
        `/client/src/nodes/System/${type}/README.md`,
        `/client/src/nodes/Custom/${type}/README.md`,
        `/src/nodes/System/${type}/README.md`,
        `/src/nodes/Custom/${type}/README.md`
      ];
      
      // Try each path
      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            return await response.text();
          }
        } catch (err) {
          // Continue to the next path
          console.log(`Failed to load README from ${path}`);
        }
      }

      // If we get here, we couldn't find a README in any location
      throw new Error(`README not found for node type: ${type}`);
    } catch (error) {
      console.error('Error fetching README:', error);
      throw error;
    }
  };

  // Function to format Markdown content with basic styling
  const formatMarkdown = (markdown: string): JSX.Element => {
    // Split the content by line breaks
    const lines = markdown.split('\n');
    
    // Process each line to apply basic formatting
    return (
      <div className="markdown">
        {lines.map((line, i) => {
          // Heading 1
          if (line.startsWith('# ')) {
            return <h1 key={i} className="text-2xl font-bold mb-4 mt-2">{line.substring(2)}</h1>;
          }
          // Heading 2
          else if (line.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold mb-3 mt-4">{line.substring(3)}</h2>;
          }
          // Heading 3
          else if (line.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-bold mb-2 mt-3">{line.substring(4)}</h3>;
          }
          // List item
          else if (line.startsWith('- ')) {
            return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
          }
          // Code block (single line)
          else if (line.startsWith('    ') || line.startsWith('\t')) {
            return <pre key={i} className="bg-muted p-2 my-2 rounded font-mono text-sm">{line.substring(4)}</pre>;
          }
          // Empty line
          else if (line.trim() === '') {
            return <div key={i} className="h-4"></div>;
          }
          // Regular text
          else {
            return <p key={i} className="mb-2">{line}</p>;
          }
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {nodeType ? `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Documentation` : 'Node Documentation'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-destructive p-4 text-center">
              {error}
            </div>
          ) : (
            <div className="p-1">
              {formatMarkdown(content)}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeReadmeModal;