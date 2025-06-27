import { useTheme } from '@web/components/providers/theme-provider';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@web/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/components/ui/popover';
import { Separator } from '@web/components/ui/separator';
import { useIsMobile } from '@web/hooks/use-mobile';
import {
  defaultPresets,
  type Preset,
  presetsArray,
} from '@web/lib/theme-presets';
import { cn } from '@web/lib/utils';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useState } from 'react';

type ThemePresetSelectProps = React.ComponentProps<typeof Button>;

interface ColorBoxProps {
  color: string;
}

const ColorBox: React.FC<ColorBoxProps> = ({ color }) => (
  <div
    className='border-muted h-3 w-3 rounded-sm border'
    style={{ backgroundColor: color }}
  />
);

interface ThemeColorsProps {
  presetName: Preset;
  mode: 'light' | 'dark';
}

const ThemeColors: React.FC<ThemeColorsProps> = ({ presetName, mode }) => {
  const styles = defaultPresets[presetName].styles[mode];
  return (
    <div className='flex gap-0.5'>
      <ColorBox color={styles.primary} />
      <ColorBox color={styles.accent} />
      <ColorBox color={styles.secondary} />
      <ColorBox color={styles.border} />
    </div>
  );
};

const ThemePresetSelect: React.FC<ThemePresetSelectProps> = ({
  className,
  ...props
}) => {
  const { preset, theme, setPreset } = useTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const triggerButton = (
    <Button
      id='theme-preset-select'
      variant='outline'
      className={cn(
        'group relative w-full justify-between md:min-w-56',
        className,
      )}
      {...props}
    >
      <div className='flex w-full items-center gap-3 overflow-hidden'>
        <div className='flex gap-0.5'>
          <ColorBox
            color={defaultPresets[preset].styles[theme].primary}
          />
          <ColorBox color={defaultPresets[preset].styles[theme].accent} />
          <ColorBox
            color={defaultPresets[preset].styles[theme].secondary}
          />
          <ColorBox color={defaultPresets[preset].styles[theme].border} />
        </div>
        <span className='truncate text-left font-medium capitalize'>
          {defaultPresets[preset]?.label || preset}
        </span>
      </div>
      <ChevronDown className='size-4 shrink-0' />
    </Button>
  );

  const commandContent = (
    <Command className='max-h-96 w-full rounded-lg border shadow-md'>
      <div className='flex w-full items-center'>
        <div className='flex w-full items-center border-b px-3 py-1'>
          <CommandInput
            placeholder='Search presets...'
            className='border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
          />
        </div>
      </div>
      <Separator />
      <CommandList className='chat-scrollbar'>
        <CommandEmpty>No themes found.</CommandEmpty>
        <CommandGroup heading='Built-in Themes'>
          {presetsArray.map(({ label }) => {
            const presetName = Object.entries(defaultPresets).find(
              ([_, value]) => value.label === label,
            )?.[0] as Preset;
            return (
              <CommandItem
                key={label}
                value={label}
                onSelect={() => {
                  setPreset(presetName);
                  setOpen(false);
                }}
                className='data-[highlighted]:bg-secondary/50 flex items-center gap-2 py-2'
              >
                <ThemeColors presetName={presetName} mode={theme} />
                <div className='flex flex-1 items-center gap-2'>
                  <span className='text-sm font-medium capitalize'>
                    {defaultPresets[presetName]?.label || presetName}
                  </span>
                </div>
                {presetName === preset && (
                  <Check className='h-4 w-4 shrink-0 opacity-70' />
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <div className='flex w-full items-center'>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Select Theme</DrawerTitle>
            </DrawerHeader>
            <div className='px-4 pb-4'>
              {commandContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className='w-[300px] p-0' align='center'>
            {commandContent}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ThemePresetSelect;
