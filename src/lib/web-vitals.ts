// Web Vitals reporting for performance monitoring
// This helps track Core Web Vitals metrics

export function reportWebVitals(metric: {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: 'web-vital' | 'custom';
}) {
  // Log metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`${metric.name}: ${metric.value}`);
  }

  // In production, you can send to analytics
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', metric.name, {
      event_category: metric.label === 'web-vital' ? 'Web Vitals' : 'Custom Metric',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      document.head.appendChild(link);
    }
  },

  // Prefetch pages for faster navigation
  prefetchPage: (href: string) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  },

  // Defer non-critical scripts
  deferScript: (src: string, callback?: () => void) => {
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      if (callback) script.onload = callback;
      document.body.appendChild(script);
    }
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  },

  // Check network connection type
  getConnectionType: () => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  },
};
