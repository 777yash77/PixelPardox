/**
 * Centralized API & WebSocket Configuration for Pixel Paradox
 * Supports local development and production deployments (e.g., Render, Vercel)
 */

export const API_BASE_URL = 
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') 
    : 'http://localhost:8080';

export const WS_BASE_URL = 
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL
    ? process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '') 
    : (API_BASE_URL.replace(/^http(s)?:\/\//, (match, s) => s ? 'wss://' : 'ws://') + '/ws');

export default API_BASE_URL;
