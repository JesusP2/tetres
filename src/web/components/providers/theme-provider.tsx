import { defaultPresets, type Theme } from '@web/lib/theme-presets';
import { createContext, useContext, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';
type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
};

const initialState: ThemeProviderState = {
  theme: 'modern-minimal',
  mode: 'system',
  setTheme: () => null,
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const defaultTheme = 'modern-minimal';
const defaultMode = 'system';
const themeKey = 'theme';
const modeKey = 'theme-mode';
export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(setThemeInDocument);
  const [mode, setMode] = useState<Mode>(setModeInDocument);

  const value = {
    theme,
    mode,
    setTheme: (theme: Theme) => {
      localStorage.setItem(themeKey, theme);
      setThemeInDocument();
      setTheme(theme);
    },
    setMode: (mode: Mode) => {
      localStorage.setItem(modeKey, mode);
      setModeInDocument();
      setMode(mode);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

function setBodyProperties(theme: Theme, mode: Exclude<Mode, 'system'>) {
  const preset = defaultPresets[theme];
  const styles = preset.styles[mode];
  Object.entries(styles).forEach(([key, value]) => {
    document.body.style.setProperty(`--${key}`, value);
  });
  return theme;
}

function setModeInDocument() {
  let mode = localStorage.getItem(modeKey) as Mode;
  if (!mode) {
    mode = 'system';
    localStorage.setItem(modeKey, mode);
  }
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  if (mode === 'system') {
    const systemMode = getSystemMode();
    root.classList.add(systemMode);
    return mode;
  }
  root.classList.add(mode);
  const theme = localStorage.getItem(themeKey) as Theme;
  setBodyProperties(theme ?? defaultTheme, mode);
  return mode;
}

function setThemeInDocument() {
  let theme = localStorage.getItem(themeKey) as Theme;
  if (!theme) {
    theme = 'modern-minimal';
    localStorage.setItem(themeKey, theme);
  }

  const mode = localStorage.getItem(modeKey) as Mode ?? defaultMode;
  setBodyProperties(theme, mode === 'system' ? getSystemMode() : mode);
  return theme;
}

function getSystemMode(): Exclude<Mode, 'system'> {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    .matches
    ? 'dark'
    : 'light';
  return systemTheme;
}
