"use client";

import * as React from "react";
import { 
  Check,
  ChevronsUpDown,
  Sparkles,
  Zap,
  Star,
  CloudLightning
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type Model =
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240229"
  | "gpt-4o"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "deepseek-chat"
  | string;

export interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  disabled?: boolean;
}

interface ModelOption {
  value: Model;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 
    | "default" 
    | "secondary" 
    | "destructive" 
    | "outline";
}

export function getModelOptions(): ModelOption[] {
  return [
    {
      value: "claude-3-opus-20240229",
      label: "Claude 3 Opus",
      description: "Most powerful model for complex tasks",
      icon: <Sparkles className="h-4 w-4 text-violet-500" />,
      badge: "Best",
      badgeVariant: "outline",
    },
    {
      value: "claude-3-sonnet-20240229",
      label: "Claude 3 Sonnet",
      description: "Great balance of capabilities and speed",
      icon: <Sparkles className="h-4 w-4 text-violet-400" />,
    },
    {
      value: "claude-3-haiku-20240229",
      label: "Claude 3 Haiku",
      description: "Fast and efficient for simpler tasks",
      icon: <Sparkles className="h-4 w-4 text-violet-300" />,
    },
    {
      value: "gpt-4o",
      label: "GPT-4o",
      description: "Latest and most capable OpenAI model",
      icon: <Zap className="h-4 w-4 text-green-500" />,
      badge: "New",
      badgeVariant: "secondary",
    },
    {
      value: "gpt-4-turbo",
      label: "GPT-4 Turbo",
      description: "Powerful model with updated knowledge",
      icon: <Zap className="h-4 w-4 text-green-400" />,
    },
    {
      value: "gpt-3.5-turbo",
      label: "GPT-3.5 Turbo",
      description: "Fast and cost-effective for simple tasks",
      icon: <Zap className="h-4 w-4 text-green-300" />,
    },
    {
      value: "deepseek-chat",
      label: "DeepSeek Chat",
      description: "Advanced open-source model",
      icon: <Star className="h-4 w-4 text-amber-400" />,
    },
  ];
}

export function getModelLabel(model: Model): string {
  const option = getModelOptions().find((option) => option.value === model);
  return option ? option.label : model;
}

export function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const options = getModelOptions();
  const selectedModel = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center">
            {selectedModel ? (
              <>
                <span className="mr-2">{selectedModel.icon}</span>
                {selectedModel.label}
              </>
            ) : (
              <span className="text-muted-foreground">Select model</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{option.icon}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="mr-2">{option.label}</span>
                        {option.badge && (
                          <Badge
                            variant={option.badgeVariant}
                            className="ml-1 py-0 px-1 text-[10px]"
                          >
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}