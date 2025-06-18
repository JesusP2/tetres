import { useTheme } from '@web/components/providers/theme-provider';
import { cn } from '@web/lib/utils';
import { useRef } from 'react';
import { buttonVariants } from './ui/button';
import { MoonIcon } from './ui/moon';
import { SunIcon } from './ui/sun';

export interface IconRef {
  startAnimation: () => void;
  stopAnimation: () => void;
}

const themeButtonId = 'theme-button';
export function ThemeButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { theme: mode, setTheme } = useTheme();
  const moonRef = useRef<IconRef>(null);
  const sunRef = useRef<IconRef>(null);

  function handleMouseEnter() {
    moonRef.current?.startAnimation();
    sunRef.current?.startAnimation();
  }

  function handleMouseLeave() {
    moonRef.current?.stopAnimation();
    sunRef.current?.stopAnimation();
  }

  return (
    <>
      <div className={cn('flex flex-col justify-center', className)} style={style}>
        <input
          type='checkbox'
          name={themeButtonId}
          id={themeButtonId}
          className='peer sr-only'
          checked={mode === 'dark'}
          onChange={e => {
            setTheme(e.target.checked ? 'dark' : 'light');
          }}
        />
        <label
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'hover:bg-opacity-0 active:bg-opacity-0 relative right-[1px] size-8 cursor-pointer select-none',
          )}
          htmlFor={themeButtonId}
          suppressHydrationWarning
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <MoonIcon
            size={16}
            className='hover:bg-opacity-0 active:bg-opacity-0 shrink-0 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100'
            aria-hidden='true'
            ref={moonRef}
          />
          <SunIcon
            size={16}
            className='hover:bg-opacity-0 active:bg-opacity-0 absolute shrink-0 scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0'
            aria-hidden='true'
            ref={sunRef}
          />
        </label>
      </div>
    </>
  );
}
