import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { K3Loader } from '@/components/K3Loader';

interface LoadingContextType {
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  loadingText: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memuat data...');

  const showLoading = useCallback((text?: string) => {
    if (text) setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading, loadingText }}>
      {children}
      {isLoading && (
        <K3Loader 
          fullScreen 
          size="xl" 
          showSlogan 
          text={loadingText} 
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
