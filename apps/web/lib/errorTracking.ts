// Error Tracking Utility
// Sentry entegrasyonu icin hazir - DSN ayarlaninca aktif olur

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private isInitialized = false;
  private dsn: string | null = null;

  init(dsn?: string) {
    this.dsn = dsn || process.env.NEXT_PUBLIC_SENTRY_DSN || null;
    this.isInitialized = !!this.dsn;

    if (this.isInitialized) {
      console.log('[ErrorTracker] Initialized with DSN');
      // Sentry.init icin yer
    } else {
      console.log('[ErrorTracker] Running in development mode (no DSN)');
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    // Console'a hatayi yazdir
    console.error('[ErrorTracker]', error.message, {
      stack: error.stack,
      ...context,
    });

    // Sentry entegrasyonu aktifse gonder
    if (this.isInitialized && this.dsn) {
      // Sentry.captureException(error, { extra: context });
      this.sendToBackend(error, context);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logMethod(`[ErrorTracker] ${message}`, context);

    if (this.isInitialized && this.dsn) {
      // Sentry.captureMessage(message, level);
    }
  }

  setUser(user: { id: string; kullaniciAdi?: string; email?: string } | null) {
    if (this.isInitialized) {
      // Sentry.setUser(user);
      console.log('[ErrorTracker] User set:', user?.id);
    }
  }

  private async sendToBackend(error: Error, context?: ErrorContext) {
    try {
      // Backend'e hata gonder (opsiyonel)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });
    } catch {
      // Sessizce basarisiz ol
    }
  }
}

export const errorTracker = new ErrorTracker();

// Global error handler
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    errorTracker.captureException(error || new Error(String(message)), {
      component: 'window.onerror',
      extra: { source, lineno, colno },
    });
  };

  window.onunhandledrejection = (event) => {
    errorTracker.captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { component: 'unhandledrejection' }
    );
  };
}

// React Error Boundary icin helper
export function captureReactError(error: Error, errorInfo: { componentStack: string }) {
  errorTracker.captureException(error, {
    component: 'ErrorBoundary',
    extra: { componentStack: errorInfo.componentStack },
  });
}
