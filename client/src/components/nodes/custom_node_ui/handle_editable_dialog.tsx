/**
 * EditableHandleDialog
 * 
 * A dialog component to create or edit handle information such as name and description.
 * Used for dynamically adding or editing inputs/outputs on node components.
 * Based on the Simple-AI.dev implementation.
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { HandleData } from './EditableHandle';

// Data types available for handles
const DATA_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
];

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dataType: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Props interface
export interface EditableHandleDialogProps {
  children: React.ReactNode;
  variant: 'create' | 'edit';
  label: string;
  description?: string;
  dataType?: string;
  onSave: (name: string, description?: string, dataType?: string) => boolean;
  onCancel: () => void;
  align?: 'start' | 'center' | 'end';
  title?: string; // Custom dialog title
}

/**
 * EditableHandleDialog Component
 * 
 * A dialog for creating or editing node connection handles.
 */
export function EditableHandleDialog({
  children,
  variant,
  label,
  description = '',
  dataType = 'string',
  onSave,
  onCancel,
  align = 'center',
  title,
}: EditableHandleDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: label,
      description: description || '',
      dataType: dataType || 'string',
    },
  });
  
  const handleOpen = useCallback(() => {
    setOpen(true);
    // Reset form when opening
    form.reset({
      name: label,
      description: description || '',
      dataType: dataType || 'string',
    });
  }, [form, label, description, dataType]);
  
  const handleClose = useCallback(() => {
    setOpen(false);
    onCancel();
  }, [onCancel]);
  
  const handleSubmit = useCallback((values: FormValues) => {
    const success = onSave(values.name, values.description, values.dataType);
    if (success) {
      setOpen(false);
    }
  }, [onSave]);
  
  // Generate a title based on variant if none provided
  const dialogTitle = title || (variant === 'create' ? 'Add New Handle' : 'Edit Handle');
  
  return (
    <>
      <div onClick={handleOpen}>{children}</div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {variant === 'create' 
                ? 'Create a new connection point for this node'
                : 'Edit the properties of this connection point'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter handle name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be displayed as the handle's label
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a data type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of data this handle will accept or provide
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this handle"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what data this handle expects or provides
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {variant === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}