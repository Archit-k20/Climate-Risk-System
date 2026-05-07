import axios from 'axios'

/**
 * Central axios instance.
 * All API calls go through this so we have one place to configure
 * base URL, headers, and error handling.
 * 
 * In development, explicitly target the FastAPI backend on port 8000.
 * In production, use the environment variable VITE_API_URL or fall back to /api/v1.
 */
const apiBaseURL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1')

export const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor — logs errors globally so every component
// doesn't need to handle network errors individually.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error?.response?.data || error.message)
    return Promise.reject(error)
  }
)