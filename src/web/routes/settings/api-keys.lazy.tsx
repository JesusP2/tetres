import { createLazyFileRoute } from '@tanstack/react-router';
import { ApiKeysSettings } from '@web/components/api-keys-settings';
import { SettingsHeader } from '@web/components/settings-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';

export const Route = createLazyFileRoute('/settings/api-keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  return (
    <Card className='mx-auto max-w-3xl'>
      <CardHeader>
        <SettingsHeader />
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage your API keys for different AI providers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeysSettings />
      </CardContent>
    </Card>
  );
}
