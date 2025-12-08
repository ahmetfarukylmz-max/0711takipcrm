import toast from 'react-hot-toast';
import { AppError, FirebaseError, ValidationError, NetworkError } from './errors';

/**
 * Handle errors with user-friendly messages
 */
export const handleError = (error: any, context?: string): void => {
  console.error(`[${context || 'Error'}]`, error);

  let appError: AppError;

  // Determine error type
  if (error instanceof AppError) {
    appError = error;
  } else if (error?.code && error.code.startsWith('auth/')) {
    appError = new FirebaseError(error);
  } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
    appError = new NetworkError('No internet connection');
  } else {
    appError = new AppError(
      'UNKNOWN_ERROR',
      error?.message || 'Unknown error',
      'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.',
      error
    );
  }

  // Show user-friendly message
  toast.error(appError.userMessage, {
    duration: 5000,
    icon: '⚠️',
  });

  // Log to monitoring service (Sentry, etc.)
  logErrorToMonitoring(appError);
};

/**
 * Log error to monitoring service
 * TODO: Integrate with Sentry/LogRocket
 */
const logErrorToMonitoring = (error: AppError): void => {
  // For now, just console.error
  // Later: Sentry.captureException(error);
  console.error('[Monitoring]', {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    timestamp: error.timestamp,
    originalError: error.originalError,
  });
};

/**
 * Async error wrapper for functions
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so caller can handle if needed
    }
  }) as T;
};

/**
 * Validate field and throw ValidationError if invalid
 */
export const validateField = (
  value: any,
  fieldName: string,
  validators: Array<(v: any) => boolean | string>
): void => {
  for (const validator of validators) {
    const result = validator(value);
    if (typeof result === 'string') {
      throw new ValidationError(result, fieldName);
    }
    if (result === false) {
      throw new ValidationError(`${fieldName} geçersiz`, fieldName);
    }
  }
};

// Common validators
export const validators = {
  required: (message?: string) => (value: any) =>
    value != null && value !== '' ? true : message || 'Bu alan zorunludur',

  email: (message?: string) => (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : message || 'Geçerli bir email adresi giriniz',

  phone: (message?: string) => (value: string) =>
    /^(0?5\d{9})$/.test(value.replace(/[\s-()]/g, ''))
      ? true
      : message || 'Geçerli bir telefon numarası giriniz',

  minLength: (min: number, message?: string) => (value: string) =>
    value.length >= min ? true : message || `En az ${min} karakter olmalıdır`,

  maxLength: (max: number, message?: string) => (value: string) =>
    value.length <= max ? true : message || `En fazla ${max} karakter olmalıdır`,

  positiveNumber: (message?: string) => (value: number) =>
    value > 0 ? true : message || 'Pozitif bir sayı giriniz',
};
