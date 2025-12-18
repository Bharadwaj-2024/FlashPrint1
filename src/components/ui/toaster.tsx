'use client';

import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';

// Lazy load toast components since they're not immediately needed
const Toast = dynamic(() => import('@/components/ui/toast').then(mod => mod.Toast), { ssr: false });
const ToastClose = dynamic(() => import('@/components/ui/toast').then(mod => mod.ToastClose), { ssr: false });
const ToastDescription = dynamic(() => import('@/components/ui/toast').then(mod => mod.ToastDescription), { ssr: false });
const ToastProvider = dynamic(() => import('@/components/ui/toast').then(mod => mod.ToastProvider), { ssr: false });
const ToastTitle = dynamic(() => import('@/components/ui/toast').then(mod => mod.ToastTitle), { ssr: false });
const ToastViewport = dynamic(() => import('@/components/ui/toast').then(mod => mod.ToastViewport), { ssr: false });

export function Toaster() {
  const { toasts } = useToast();

  // Don't render anything if no toasts
  if (toasts.length === 0) {
    return null;
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
