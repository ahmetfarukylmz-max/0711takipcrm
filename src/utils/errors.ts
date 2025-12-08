// Firestore error kodları
export enum FirestoreErrorCode {
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  FAILED_PRECONDITION = 'failed-precondition',
  UNAVAILABLE = 'unavailable',
  UNAUTHENTICATED = 'unauthenticated',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  UNKNOWN = 'unknown',
}

// Custom error class
export class AppError extends Error {
  code: string;
  userMessage: string;
  originalError?: any;
  timestamp: string;

  constructor(code: string, message: string, userMessage: string, originalError?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// Firebase error mapper
export class FirebaseError extends AppError {
  constructor(error: any) {
    const code = error?.code || FirestoreErrorCode.UNKNOWN;
    const userMessage = FirebaseError.getUserMessage(code);

    super(code, error?.message || 'Unknown error', userMessage, error);

    this.name = 'FirebaseError';
  }

  static getUserMessage(code: string): string {
    const messages: Record<string, string> = {
      [FirestoreErrorCode.PERMISSION_DENIED]:
        'Bu işlem için yetkiniz yok. Lütfen yöneticinizle iletişime geçin.',
      [FirestoreErrorCode.NOT_FOUND]: 'İstenen kayıt bulunamadı. Sayfa yenilenecek.',
      [FirestoreErrorCode.ALREADY_EXISTS]: 'Bu kayıt zaten mevcut.',
      [FirestoreErrorCode.FAILED_PRECONDITION]: 'İşlem gerekli koşulları karşılamıyor.',
      [FirestoreErrorCode.UNAVAILABLE]:
        'Bağlantı sorunu yaşanıyor. Lütfen internet bağlantınızı kontrol edin.',
      [FirestoreErrorCode.UNAUTHENTICATED]: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
      [FirestoreErrorCode.RESOURCE_EXHAUSTED]:
        'Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.',
    };

    return messages[code] || 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

// Validation error
export class ValidationError extends AppError {
  field?: string;

  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message, message, null);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Network error
export class NetworkError extends AppError {
  constructor(message: string) {
    super(
      'NETWORK_ERROR',
      message,
      'İnternet bağlantısı bulunamadı. Lütfen bağlantınızı kontrol edin.',
      null
    );
    this.name = 'NetworkError';
  }
}
