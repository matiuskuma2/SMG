import { useState } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState extends ToastOptions {
  isOpen: boolean;
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({
    isOpen: false,
  });

  const toast = (options: ToastOptions) => {
    setToastState({
      ...options,
      isOpen: true,
    });

    // 3秒後に自動的に閉じる
    setTimeout(() => {
      setToastState(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  return {
    toast,
    toastState,
  };
} 