import { createLazyFileRoute } from '@tanstack/react-router';
import { SettingsHeader } from '@web/components/settings-header';
import ThemePresetSelect from '@web/components/theme-preset-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Label } from '@web/components/ui/label';

export const Route = createLazyFileRoute('/settings/')({
  component: CustomizationSettings,
});

function CustomizationSettings() {
  return (
    <Card className='mx-auto max-w-3xl'>
      <CardHeader>
        <SettingsHeader />
        <CardTitle>Customization</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor='theme-preset-select' className='mb-2 text-sm'>Theme Presets</Label>
        <ThemePresetSelect className="max-w-xs" />
      </CardContent>
    </Card >
  );
}
