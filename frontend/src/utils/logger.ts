import axios from 'axios';
import { API_BASE_URL } from '../services/api';

type LogLevel = 'info' | 'warn' | 'error';

interface ClientLog {
  level: LogLevel;
  message: string;
  stack?: string;
  component?: string;
  url: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private queue: ClientLog[] = [];
  private isProcessing = false;

  private constructor() {
    // Listen for global errors
    window.addEventListener('error', (event) => {
      this.error(`Global error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error(`Unhandled Promise rejection: ${event.reason}`, {
        reason: event.reason
      });
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, metadata?: Record<string, any>, component?: string) {
    this.enqueue('info', message, undefined, component, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>, component?: string) {
    this.enqueue('warn', message, undefined, component, metadata);
  }

  public error(message: string, metadata?: Record<string, any>, stack?: string, component?: string) {
    this.enqueue('error', message, stack, component, metadata);
  }

  private enqueue(level: LogLevel, message: string, stack?: string, component?: string, metadata?: Record<string, any>) {
    const log: ClientLog = {
      level,
      message,
      stack,
      component,
      url: window.location.href,
      metadata
    };

    // Also log to console in dev
    if (import.meta.env.DEV) {
      const consoleMethod = level === 'info' ? 'log' : level;
      console[consoleMethod](`[${component || 'Client'}] ${message}`, metadata || '');
    }

    this.queue.push(log);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    // Cap the queue to prevent memory growth if the server is down
    if (this.queue.length > 50) {
      this.queue = this.queue.slice(-50);
    }
    
    const batch = this.queue.splice(0, 5);

    try {
      // Use a clean axios instance to avoid interceptors that might log
      await Promise.all(batch.map(log => 
        axios.post(`${API_BASE_URL}/logs/client`, log, {
          timeout: 5000,
          headers: { 'X-Skip-Logging': 'true' }
        }).catch(() => {
          // Silent fail - DO NOT log this failure back to the logger
        })
      ));
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        // Wait a bit before next batch to prevent flooding
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }
}

export const logger = Logger.getInstance();
