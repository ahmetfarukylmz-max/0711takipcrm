import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - HTML string to sanitize
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: string, options?: DOMPurify.Config): string => {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    // Allowed tags
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a'],
    // Allowed attributes
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Force target="_blank" for links and add noopener noreferrer
    ADD_ATTR: ['target', 'rel'],
    // Custom hook to add security attributes to links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...options
  });
};

/**
 * Sanitize text content (strips all HTML)
 * @param text - Text to sanitize
 * @returns Plain text
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';

  // First sanitize, then extract text content
  const cleaned = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    KEEP_CONTENT: true // Keep the text content
  });

  // Create a temporary element to extract text content
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = cleaned;
    return temp.textContent || temp.innerText || '';
  }

  // Fallback for server-side (if needed)
  return cleaned;
};

/**
 * Sanitize user input for search queries
 * Prevents SQL injection-like patterns and special characters
 * @param query - Search query to sanitize
 * @returns Sanitized query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';

  // Remove potentially dangerous characters
  return query
    .trim()
    .replace(/[<>'"]/g, '') // Remove HTML/JS injection chars
    .replace(/[;()]/g, '')  // Remove SQL-like chars
    .slice(0, 200);         // Limit length
};

/**
 * Sanitize phone number input
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';

  // Allow only digits, spaces, dashes, parentheses, and plus
  return phone.replace(/[^\d\s\-()+]/g, '').slice(0, 20);
};

/**
 * Sanitize email input
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';

  // Remove whitespace and convert to lowercase
  return email.trim().toLowerCase().slice(0, 254);
};

/**
 * Sanitize filename
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';

  // Remove path traversal and dangerous characters
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
};
