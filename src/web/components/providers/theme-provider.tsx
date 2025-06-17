import { defaultPresets, type Preset } from '@web/lib/theme-presets';
import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  preset: Preset;
  theme: Theme;
  setPreset: (presetName: Preset) => void;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  preset: 'mocha-mousse',
  theme: 'light',
  setPreset: () => null,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const presetKey = 'preset';
const themeKey = 'theme';
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [preset, setPreset] = useState<Preset>(setPresetInDocument);
  const [theme, setTheme] = useState<Theme>(setThemeInDocument);

  const value = {
    preset,
    theme,
    setPreset: (preset: Preset) => {
      localStorage.setItem(presetKey, preset);
      setPresetInDocument();
      setPreset(preset);
    },
    setTheme: (theme: Theme) => {
      localStorage.setItem(themeKey, theme);
      setThemeInDocument();
      setTheme(theme);
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

function setBodyProperties(
  presetName: Preset,
  theme: Exclude<Theme, 'system'>,
) {
  const preset = defaultPresets[presetName];
  const styles = preset.styles[theme];
  Object.entries(styles).forEach(([key, value]) => {
    document.body.style.setProperty(`--${key}`, value);
  });
  return presetName;
}

function setThemeInDocument() {
  let theme = localStorage.getItem(themeKey) as Theme;
  if (!theme) {
    theme = 'light';
    localStorage.setItem(themeKey, theme);
  }
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  const preset = localStorage.getItem(presetKey) as Preset;
  setBodyProperties(preset ?? initialState.preset, theme);
  return theme;
}

function setPresetInDocument() {
  let presetName = localStorage.getItem(presetKey) as Preset;
  if (!presetName) {
    presetName = 'modern-minimal';
    localStorage.setItem(presetKey, presetName);
  }

  const theme = (localStorage.getItem(themeKey) as Theme) ?? initialState.theme;
  setBodyProperties(presetName, theme);
  return presetName;
}
