import { createContext, useContext, useEffect, useState } from 'react';

type IsOnlineProviderProps = {
  children: React.ReactNode;
};

type IsOnlineProviderState = {
  isOnline: boolean;
  isChecking: boolean;
};

const initialState: IsOnlineProviderState = {
  isOnline: navigator.onLine,
  isChecking: false,
};

const IsOnlineProviderContext = createContext<IsOnlineProviderState>(initialState);

export function IsOnlineProvider({ children, ...props }: IsOnlineProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsChecking(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsChecking(false);
    };

    // Additional check with fetch to verify actual internet connectivity
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      setIsChecking(true);
      try {
        // Use a cache-busting parameter to ensure we're actually testing network connectivity
        const response = await fetch('/api/ping', {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      } finally {
        setIsChecking(false);
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConnectivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    checkConnectivity();
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkConnectivity();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const value = {
    isOnline,
    isChecking,
  };

  return (
    <IsOnlineProviderContext.Provider {...props} value={value}>
      {children}
    </IsOnlineProviderContext.Provider>
  );
}

export const useIsOnline = () => {
  const context = useContext(IsOnlineProviderContext);

  if (context === undefined)
    throw new Error('useIsOnline must be used within an IsOnlineProvider');

  return context;
};
