import * as Sentry from '@sentry/nextjs';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private isInitialized = false;

  init() {
    // Sentry is auto-initialized via sentry.client.config.ts
    this.isInitialized = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (this.isInitialized) {
      console.log('[ErrorTracker] Sentry initialized');
    } else {
      console.log('[ErrorTracker] Running in development mode (no Sentry DSN)');
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    // Always log to console
    console.error('[ErrorTracker]', error.message, {
      stack: error.stack,
      ...context,
    });

    // Send to Sentry if initialized
    if (this.isInitialized) {
      Sentry.withScope((scope) => {
        if (context?.component) {
          scope.setTag('component', context.component);
        }
        if (context?.action) {
          scope.setTag('action', context.action);
        }
        if (context?.extra) {
          scope.setExtras(context.extra);
        }
        Sentry.captureException(error);
      });
    }
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ) {
    const logMethod =
      level === 'error'
        ? console.error
        : level === 'warning'
          ? console.warn
          : console.log;

    logMethod(`[ErrorTracker] ${message}`, context);

    if (this.isInitialized) {
      const sentryLevel =
        level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info';

      Sentry.withScope((scope) => {
        if (context?.component) {
          scope.setTag('component', context.component);
        }
        if (context?.action) {
          scope.setTag('action', context.action);
        }
        if (context?.extra) {
          scope.setExtras(context.extra);
        }
        Sentry.captureMessage(message, sentryLevel);
      });
    }
  }

  setUser(user: { id: string; kullaniciAdi?: string; email?: string } | null) {
    if (this.isInitialized) {
      if (user) {
        Sentry.setUser({
          id: user.id,
          username: user.kullaniciAdi,
          email: user.email,
        });
      } else {
        Sentry.setUser(null);
      }
      console.log('[ErrorTracker] User set:', user?.id);
    }
  }

  // Add custom breadcrumb
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
  ) {
    if (this.isInitialized) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    }
  }

  // Set custom tag
  setTag(key: string, value: string) {
    if (this.isInitialized) {
      Sentry.setTag(key, value);
    }
  }

  // Start a performance transaction
  startTransaction(name: string, op: string) {
    if (this.isInitialized) {
      return Sentry.startInactiveSpan({ name, op });
    }
    return null;
  }
}

export const errorTracker = new ErrorTracker();

// React Error Boundary helper
export function captureReactError(
  error: Error,
  errorInfo: { componentStack: string }
) {
  errorTracker.captureException(error, {
    component: 'ErrorBoundary',
    extra: { componentStack: errorInfo.componentStack },
  });
}

// API error helper
export function captureApiError(error: Error, endpoint: string, method: string) {
  errorTracker.captureException(error, {
    component: 'API',
    action: `${method} ${endpoint}`,
  });
}

// Game error helper
export function captureGameError(
  error: Error,
  gameId: string,
  action: string
) {
  errorTracker.captureException(error, {
    component: 'Game',
    action,
    extra: { gameId },
  });
}
