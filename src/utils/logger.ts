/**
 * Logger Utility
 *
 * Production ortamında console.log'ları devre dışı bırakır.
 * Development ortamında normal çalışır.
 *
 * Kullanım:
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.log('Debug info');
 * logger.error('Error occurred');
 * logger.warn('Warning message');
 * ```
 */

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

/**
 * Development ve test ortamlarında console.log kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const log = (...args: any[]): void => {
  if (isDevelopment || isTest) {
    console.log(...args);
  }
};

/**
 * Tüm ortamlarda console.error kullanır (error'lar her zaman loglanmalı)
 */
const error = (...args: any[]): void => {
  console.error(...args);
};

/**
 * Development ve test ortamlarında console.warn kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const warn = (...args: any[]): void => {
  if (isDevelopment || isTest) {
    console.warn(...args);
  }
};

/**
 * Development ortamında console.info kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const info = (...args: any[]): void => {
  if (isDevelopment) {
    console.info(...args);
  }
};

/**
 * Development ortamında console.debug kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const debug = (...args: any[]): void => {
  if (isDevelopment) {
    console.debug(...args);
  }
};

/**
 * Development ortamında console.table kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const table = (data: any): void => {
  if (isDevelopment) {
    console.table(data);
  }
};

/**
 * Development ortamında console.group kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const group = (label: string): void => {
  if (isDevelopment) {
    console.group(label);
  }
};

/**
 * Development ortamında console.groupEnd kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const groupEnd = (): void => {
  if (isDevelopment) {
    console.groupEnd();
  }
};

/**
 * Development ortamında console.time kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const time = (label: string): void => {
  if (isDevelopment) {
    console.time(label);
  }
};

/**
 * Development ortamında console.timeEnd kullanır
 * Production ortamında hiçbir şey yapmaz
 */
const timeEnd = (label: string): void => {
  if (isDevelopment) {
    console.timeEnd(label);
  }
};

export const logger = {
  log,
  error,
  warn,
  info,
  debug,
  table,
  group,
  groupEnd,
  time,
  timeEnd,
};

export default logger;
