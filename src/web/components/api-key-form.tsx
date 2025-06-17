import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

interface ApiKeyFormProps {
  provider: string;
  onSubmit: (apiKey: string) => Promise<void>;
  onCancel: () => void;
}

export function ApiKeyForm({ provider, onSubmit, onCancel }: ApiKeyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: '',
    },
  });

  const handleSubmit = async (data: ApiKeyFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.apiKey);
      form.reset();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={`Enter your ${provider} API key`}
                  {...field}
                />
              </FormControl>
              <ProviderInstructions provider={provider} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validating...' : 'Add API Key'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

const ProviderInstructions = ({ provider }: { provider: string }) => {
  switch (provider.toLowerCase()) {
    case 'openrouter':
      return (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>To get your OpenRouter API key:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a></li>
            <li>Create a new API key</li>
            <li>Copy and paste it below</li>
          </ol>
          <p className="mt-2 text-xs">Your key will be encrypted and stored securely.</p>
        </div>
      );
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Enter your {provider} API key. It will be encrypted and stored securely.
        </div>
      );
  }
};
