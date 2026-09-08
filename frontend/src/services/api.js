/**
 * api.js
 * Centralized Axios instance for PharmaChain AI.
 * baseURL is read from REACT_APP_API_URL — never hardcoded.
 * Request interceptor attaches Bearer token from localStorage if present.
 */

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request when one is stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pharma_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
