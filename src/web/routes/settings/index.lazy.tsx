import { createLazyFileRoute } from '@tanstack/react-router';
import { useTheme } from '@web/components/providers/theme-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Label } from '@web/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@web/components/ui/radio-group';

export const Route = createLazyFileRoute('/settings/')({
  component: CustomizationSettings,
});

function CustomizationSettings() {
  const { mode, setMode } = useTheme();

  return (
    <Card className='mx-auto max-w-3xl'>
      <CardHeader>
        <CardTitle>Customization</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <Label>Theme</Label>
          <RadioGroup
            value={mode}
            onValueChange={setMode}
            className='grid max-w-md grid-cols-3 gap-8 pt-2'
          >
            <Label className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary flex flex-col items-center justify-between rounded-md border-2 p-4'>
              <RadioGroupItem value='light' className='sr-only' />
              <span className='mb-2 text-sm'>Light</span>
            </Label>
            <Label className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary flex flex-col items-center justify-between rounded-md border-2 p-4'>
              <RadioGroupItem value='dark' className='sr-only' />
              <span className='mb-2 text-sm'>Dark</span>
            </Label>
            <Label className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary flex flex-col items-center justify-between rounded-md border-2 p-4'>
              <RadioGroupItem value='system' className='sr-only' />
              <span className='mb-2 text-sm'>System</span>
            </Label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
