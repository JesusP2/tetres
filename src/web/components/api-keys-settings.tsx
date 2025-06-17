import { useUser } from '@web/hooks/use-user';
import { deleteKey, toggleApiKey } from '@web/lib/api-keys';
import { db } from '@web/lib/instant';
import { addKey } from '@web/services';
import { format } from 'date-fns';
import { useState } from 'react';
import { ApiKeyForm } from './api-key-form';
import { useConfirmDialog } from './providers/confirm-dialog-provider';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

type Provider = {
  id: string;
  name: string;
  description: string;
};

const PROVIDERS: Provider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models through OpenRouter API',
  },
];

export function ApiKeysSettings() {
  const user = useUser();
  const apiKeysQuery = db.useQuery(
    user?.data
      ? {
          apiKeys: {
            $: { where: { userId: user.data.id } },
          },
        }
      : null,
  );
  const apiKeys = apiKeysQuery.data?.apiKeys || [];
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { confirmDelete } = useConfirmDialog();

  const getKeyForProvider = (providerId: string) =>
    apiKeys.find(key => key.provider === providerId);

  const handleDeleteKey = async (keyId: string, provider: string) => {
    confirmDelete({
      title: 'Delete API Key?',
      description: `Are you sure you want to delete your ${provider} API key? This action cannot be undone.`,
      handleConfirm: () => deleteKey(keyId),
    });
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>API Keys</h2>
        <p className='text-muted-foreground'>
          Add your own API keys to use instead of the global keys. Your keys are
          encrypted and stored securely.
        </p>
      </div>

      {PROVIDERS.map(provider => {
        const existingKey = getKeyForProvider(provider.id);
        return (
          <Card key={provider.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='capitalize'>{provider.name}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  {existingKey ? (
                    <div className='flex items-center gap-2'>
                      <Badge variant='default'>✓ Configured</Badge>
                      {existingKey.lastValidated && (
                        <span className='text-muted-foreground text-xs'>
                          Last validated:{' '}
                          {format(
                            new Date(existingKey.lastValidated),
                            'MMM d, yyyy',
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant='secondary'>Using global key</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!existingKey && selectedProvider !== provider.id && (
                <Button onClick={() => setSelectedProvider(provider.id)}>
                  Add Your {provider.name} API Key
                </Button>
              )}
              {selectedProvider === provider.id && (
                <ApiKeyForm
                  provider={provider.name}
                  onSubmit={async apiKey => {
                    await addKey(provider.id, apiKey);
                    setSelectedProvider(null);
                  }}
                  onCancel={() => setSelectedProvider(null)}
                />
              )}
              {existingKey && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Use your API key instead of global key</Label>
                      <p className='text-muted-foreground text-sm'>
                        When enabled, your personal API key will be used for all
                        requests
                      </p>
                    </div>
                    <Switch
                      checked={existingKey.isActive}
                      onCheckedChange={checked =>
                        toggleApiKey(existingKey.id, checked)
                      }
                    />
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      Update Key
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() =>
                        handleDeleteKey(existingKey.id, provider.name)
                      }
                    >
                      Remove Key
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
