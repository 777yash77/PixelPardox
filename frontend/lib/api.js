/**
 * Centralized Dynamic API & WebSocket Configuration for Pixel Paradox
 * Supports local development, dynamic AWS EC2 IP changes, and custom domain deployments.
 * Automatically resolves the backend to port 8080 on the same host the browser is visiting.
 */

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    // In the browser, dynamically route all API calls to the same host that served the page on port 8080.
    // This seamlessly handles AWS EC2 public IP changes, Elastic IPs, domain names, or localhost.
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:8080`;
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
}

export function getWsBaseUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.hostname}:8080/ws`;
  }
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/^http(s)?:\/\//, (match, s) => s ? 'wss://' : 'ws://') + '/ws';
}

// Proxy wrapper so any code doing `${API_BASE_URL}/...` or `API_BASE_URL.replace(...)` resolves dynamically!
export const API_BASE_URL = new Proxy({}, {
  get(target, prop) {
    const val = getApiBaseUrl();
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
      return () => val;
    }
    if (typeof val[prop] === 'function') {
      return val[prop].bind(val);
    }
    return val[prop];
  }
});

export const WS_BASE_URL = new Proxy({}, {
  get(target, prop) {
    const val = getWsBaseUrl();
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
      return () => val;
    }
    if (typeof val[prop] === 'function') {
      return val[prop].bind(val);
    }
    return val[prop];
  }
});

export default API_BASE_URL;
