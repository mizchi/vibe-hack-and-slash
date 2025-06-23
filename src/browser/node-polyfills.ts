// Node.js polyfills for browser environment
import { Buffer } from 'buffer';
import process from 'process';

// グローバルに設定
(window as any).Buffer = Buffer;
(window as any).process = process;

// process.env の設定
process.env.FORCE_COLOR = 'true';
process.env.NODE_ENV = 'production';

// その他の必要なpolyfill
(window as any).global = window;
(window as any).setImmediate = (window as any).setImmediate || ((fn: Function) => setTimeout(fn, 0));