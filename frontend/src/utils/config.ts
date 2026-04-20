// Re-exports from the single source of truth in api.ts
// Use BACKEND to construct media/upload URLs (no /api prefix)
export { HOST_URL as BACKEND } from '../services/api';