/**
 * ThemeContext.js
 * Global dark-mode state for PharmaChain AI.
 *
 * Provides:
 *   darkMode       – boolean
 *   toggleDarkMode – () => void
 *
 * Persists preference to localStorage key "pharma_dark_mode".
 * Initialises from localStorage on first load.
 */

import React, { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "pharma_dark_mode";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export default ThemeContext;
