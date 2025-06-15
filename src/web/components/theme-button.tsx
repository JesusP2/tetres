import { useRef } from "react";
import { MoonIcon } from "./ui/moon";
import { SunIcon } from "./ui/sun";
import { buttonVariants } from "./ui/button";
import { cn } from "@web/lib/utils";
import { useTheme } from '@web/components/providers/theme-provider';

export interface IconRef {
  startAnimation: () => void;
  stopAnimation: () => void;
}

const themeButtonId = "theme-button";
export function ThemeButton() {
  const { mode, setTheme, setMode } = useTheme();
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
      <div className="flex flex-col justify-center">
        <input
          type="checkbox"
          name={themeButtonId}
          id={themeButtonId}
          className="peer sr-only"
          checked={mode === "dark"}
          onChange={(e) => {
            setMode(e.target.checked ? "dark" : "light")
          }}
        />
        <label
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "size-8 relative right-[1px] hover:bg-opacity-0 active:bg-opacity-0 cursor-pointer select-none",
          )}
          htmlFor={themeButtonId}
          suppressHydrationWarning
          aria-label={`Switch to ${mode === 'light' ? "dark" : "light"} mode`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <MoonIcon
            size={16}
            className="shrink-0 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100 hover:bg-opacity-0 active:bg-opacity-0"
            aria-hidden="true"
            ref={moonRef}
          />
          <SunIcon
            size={16}
            className="absolute shrink-0 scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0 hover:bg-opacity-0 active:bg-opacity-0"
            aria-hidden="true"
            ref={sunRef}
          />
        </label>
      </div>
      <button onClick={() => setTheme("t3-chat")}>
        t3-chat
      </button>
      <button onClick={() => setTheme("modern-minimal")}>
        modern-minimal
      </button>
    </>
  );
}
