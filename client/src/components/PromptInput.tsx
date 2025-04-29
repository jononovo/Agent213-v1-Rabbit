import { useState } from 'react';
import { useChat } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

const PromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage, toggleChat } = useChat();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (prompt.trim() === '' || isLoading) return;
    
    // Store prompt before clearing
    const userText = prompt;
    
    // Log the prompt (can be removed in production)
    console.log('Submitting prompt:', userText);
    
    // Clear the prompt
    setPrompt('');
    
    // Add user message to chat
    addMessage(userText, 'user');
    
    // Open chat sidebar
    toggleChat();
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Send request to the main chat UI endpoint
      const data = await apiClient.post('/api/user-chat-ui-main', { prompt: userText });
      
      // Add the agent's response to the chat
      if (data.success) {
        // Add coordinator output if available
        if (data.coordinatorResult) {
          // Check if we have a formatted message from the server
          if (data.coordinatorResult.formattedMessage) {
            addMessage(data.coordinatorResult.formattedMessage, 'agent');
          } 
          // Otherwise check the output
          else if (data.coordinatorResult.output) {
            // Check if the output is a string or an object
            if (typeof data.coordinatorResult.output === 'string') {
              // Check if it looks like HTML
              if (data.coordinatorResult.output.trim().startsWith('<!DOCTYPE html>') || 
                  data.coordinatorResult.output.trim().startsWith('<html')) {
                addMessage("I received a response but it was in the wrong format. Please try a different query.", 'system');
              } 
              // Check if it's a JSON string with agent creation info
              else if (data.coordinatorResult.output.trim().startsWith('{') && 
                  data.coordinatorResult.output.trim().endsWith('}')) {
                try {
                  // Parse the JSON string into an object
                  const jsonData = JSON.parse(data.coordinatorResult.output);
                  
                  // Check for agent creation success message patterns in structured data
                  if (jsonData.result?.settings?.successMessage) {
                    addMessage(jsonData.result.settings.successMessage, 'agent');
                  } else if (jsonData.settings?.successMessage) {
                    addMessage(jsonData.settings.successMessage, 'agent');
                  } else if (jsonData.message && (jsonData.message.includes("created") || jsonData.message.includes("agent"))) {
                    addMessage(jsonData.message, 'agent');
                  } else {
                    // If not an agent creation response, show the raw JSON
                    addMessage(data.coordinatorResult.output, 'agent');
                  }
                } catch (error) {
                  // If parsing fails, just display the string
                  console.error("Error parsing JSON response:", error);
                  addMessage(data.coordinatorResult.output, 'agent');
                }
              } else {
                // It's a regular string, so display it
                addMessage(data.coordinatorResult.output, 'agent');
              }
            } 
            // It's already an object
            else if (typeof data.coordinatorResult.output === 'object') {
              // For agent creation responses, extract and format the message
              if (data.coordinatorResult.output.result?.settings?.successMessage) {
                addMessage(data.coordinatorResult.output.result.settings.successMessage, 'agent');
              } else if (data.coordinatorResult.output.settings?.successMessage) {
                addMessage(data.coordinatorResult.output.settings.successMessage, 'agent');
              } else if (data.coordinatorResult.output.message) {
                addMessage(data.coordinatorResult.output.message, 'agent');
              } else if (data.coordinatorResult.output.text) {
                addMessage(data.coordinatorResult.output.text, 'agent');
              } else {
                // Just use a generic message if we can't extract a specific one
                addMessage("Operation completed successfully", 'agent');
              }
            }
          }
        }
        
        // Only show generator output if no agent-related coordinatorResult was shown
        // Check if we just processed an agent creation coordinatorResult
        const isAgentCreationRequest = userText.toLowerCase().includes('create') && 
                                      userText.toLowerCase().includes('agent');
        const hasCoordinatorResult = !!data.coordinatorResult && 
                                   (!!data.coordinatorResult.output || 
                                    !!data.coordinatorResult.formattedMessage);
                                    
        // Only show generator output if we don't have an agent creation coordinatorResult
        if (data.generatorResult && data.generatorResult.output && 
            (!isAgentCreationRequest || !hasCoordinatorResult)) {
          setTimeout(() => {
            // Handle generator output the same way
            if (typeof data.generatorResult.output === 'string') {
              // Check if it looks like HTML
              if (data.generatorResult.output.trim().startsWith('<!DOCTYPE html>') || 
                  data.generatorResult.output.trim().startsWith('<html')) {
                // Don't show anything - the coordinator will handle it
              } 
              // Check if it's a JSON string with agent creation info
              else if (data.generatorResult.output.trim().startsWith('{') && 
                  data.generatorResult.output.trim().endsWith('}')) {
                try {
                  // Parse the JSON string into an object
                  const jsonData = JSON.parse(data.generatorResult.output);
                  
                  // Check for agent creation success message patterns in structured data
                  if (jsonData.result?.settings?.successMessage) {
                    addMessage(jsonData.result.settings.successMessage, 'agent');
                  } else if (jsonData.settings?.successMessage) {
                    addMessage(jsonData.settings.successMessage, 'agent');
                  } else if (jsonData.message && (jsonData.message.includes("created") || jsonData.message.includes("agent"))) {
                    addMessage(jsonData.message, 'agent');
                  } else {
                    // If not an agent creation response, show the raw JSON
                    addMessage(data.generatorResult.output, 'agent');
                  }
                } catch (error) {
                  // If parsing fails, just display the string
                  console.error("Error parsing JSON response:", error);
                  addMessage(data.generatorResult.output, 'agent');
                }
              } else {
                // It's a regular string, so display it
                addMessage(data.generatorResult.output, 'agent');
              }
            } else if (typeof data.generatorResult.output === 'object') {
              // For structured responses, try to extract a meaningful message
              const message = data.generatorResult.output.result?.settings?.successMessage ||
                             data.generatorResult.output.settings?.successMessage ||
                             data.generatorResult.output.message || 
                             data.generatorResult.output.text ||
                             "Operation completed successfully";
              addMessage(message, 'agent');
            }
          }, 1000);
        }
        
        // Handle direct result output (for agent-specific workflows)
        if (data.result && !data.coordinatorResult && !data.generatorResult) {
          if (typeof data.result === 'string') {
            addMessage(data.result, 'agent');
          } else if (typeof data.result === 'object') {
            // For agent creation responses, extract and format the message
            if (data.result.settings?.successMessage) {
              addMessage(data.result.settings.successMessage, 'agent');
            } else {
              // Use a generic message
              addMessage("Operation completed successfully", 'agent');
            }
          }
        }
      } else {
        // Handle error response
        const errorMessage = data.message || 'Unknown error occurred';
        addMessage(`Sorry, I encountered an error: ${errorMessage}`, 'system');
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending prompt to chat UI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      addMessage(`Sorry, I encountered an error while processing your request. Please try again.`, 'system');
      
      toast({
        title: "Error",
        description: "Failed to connect to the agent service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0 mt-1">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <div className="ml-4 flex-grow">
            <div className="text-sm text-slate-500 mb-2">Coordinator Agent</div>
            <div className="text-slate-700 mb-4">
              Hi there! I'm ready to help you build a new agent. What would you like to create today?
            </div>
            <div className="relative">
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" 
                rows={2} 
                placeholder={isLoading ? "Processing your request..." : "Describe what you want to build or ask for help..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              ></textarea>
              <Button 
                className="absolute right-3 bottom-3"
                onClick={handleSubmit}
                size="sm"
                variant="ghost"
                disabled={isLoading || prompt.trim() === ''}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-1 border-2 border-t-transparent border-primary rounded-full"></span>
                  </span>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </div>
            
            {/* Suggestions and Build button */}
            <div className="mt-4">
              {/* Suggestion buttons */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <button 
                    className={`px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                    onClick={() => !isLoading && handleSuggestionClick("Build a customer support agent for my e-commerce store that can handle order tracking and returns")}
                    disabled={isLoading}
                  >
                    Build a customer support agent
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                    onClick={() => !isLoading && handleSuggestionClick("Create a data analysis workflow that can process CSV files and generate insights")}
                    disabled={isLoading}
                  >
                    Create a data analysis workflow
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                    onClick={() => !isLoading && handleSuggestionClick("Design a social media scheduler that can post content across multiple platforms")}
                    disabled={isLoading}
                  >
                    Design a social media scheduler
                  </button>
                </div>
              </div>
              
              {/* Build button */}
              <div className="flex justify-end">
                <Button 
                  className="px-8 py-2 bg-primary text-white rounded-md font-medium"
                  variant="default"
                  size="default"
                  onClick={handleSubmit}
                  disabled={isLoading || prompt.trim() === ''}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></span>
                      Building...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <i className="fas fa-tools mr-2"></i>
                      Build
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
