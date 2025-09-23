import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { Toaster } from './sonner';
import { ToastNotification } from '../../types';

interface ToastContextType {
  addToast: (message: string, type: ToastNotification['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom Toaster that doesn't depend on next-themes
const CustomToaster = () => {
  return (
    <Toaster
      theme="dark" // Use dark theme by default to match our shadcn setup
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const addToast = useCallback((message: string, type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
      default:
        toast(message);
        break;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <CustomToaster />
    </ToastContext.Provider>
  );
};

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};