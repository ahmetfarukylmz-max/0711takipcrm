import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeSearchQuery,
  sanitizePhone,
  sanitizeEmail,
  sanitizeFilename
} from './sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>World</strong></p>');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('should remove onclick handlers', () => {
    const input = '<button onclick="alert(\'XSS\')">Click me</button>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('should sanitize malicious links', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should strip all HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });

  it('should remove scripts but keep text', () => {
    const input = 'Hello<script>alert("XSS")</script> World';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });
});

describe('sanitizeSearchQuery', () => {
  it('should remove dangerous characters', () => {
    const input = 'search<script>alert("XSS")</script>';
    const result = sanitizeSearchQuery(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toBe('searchscriptalertXSS/script');
  });

  it('should limit query length', () => {
    const input = 'a'.repeat(300);
    const result = sanitizeSearchQuery(input);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('should trim whitespace', () => {
    const input = '  search query  ';
    const result = sanitizeSearchQuery(input);
    expect(result).toBe('search query');
  });
});

describe('sanitizePhone', () => {
  it('should allow valid phone characters', () => {
    const input = '+90 (555) 123-4567';
    const result = sanitizePhone(input);
    expect(result).toBe('+90 (555) 123-4567');
  });

  it('should remove letters', () => {
    const input = '0555ABC1234567';
    const result = sanitizePhone(input);
    expect(result).toBe('05551234567');
  });

  it('should limit length', () => {
    const input = '1'.repeat(50);
    const result = sanitizePhone(input);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe('sanitizeEmail', () => {
  it('should convert to lowercase', () => {
    const input = 'Test@Example.COM';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });

  it('should trim whitespace', () => {
    const input = '  test@example.com  ';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });

  it('should limit length', () => {
    const input = 'a'.repeat(300) + '@example.com';
    const result = sanitizeEmail(input);
    expect(result.length).toBeLessThanOrEqual(254);
  });
});

describe('sanitizeFilename', () => {
  it('should remove path traversal', () => {
    const input = '../../etc/passwd';
    const result = sanitizeFilename(input);
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('should remove dangerous characters', () => {
    const input = 'file<>:"|?*.txt';
    const result = sanitizeFilename(input);
    expect(result).toBe('file-------.txt');
  });

  it('should limit length', () => {
    const input = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(input);
    expect(result.length).toBeLessThanOrEqual(255);
  });
});
