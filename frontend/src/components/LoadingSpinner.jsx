/**
 * LoadingSpinner.jsx
 * Reusable CSS spinner with optional message.
 *
 * Props:
 *   size     – "small" | "medium" (default) | "large"
 *   message  – optional string displayed below spinner
 */

import React from "react";

const SIZES = {
  small:  { width: 20,  height: 20,  border: 3 },
  medium: { width: 36,  height: 36,  border: 4 },
  large:  { width: 56,  height: 56,  border: 5 },
};

// Inject keyframe once
if (!document.getElementById("spinner-keyframe")) {
  const s = document.createElement("style");
  s.id = "spinner-keyframe";
  s.textContent = "@keyframes _spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}

function LoadingSpinner({ size = "medium", message }) {
  const dim = SIZES[size] || SIZES.medium;

  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      style={styles.wrapper}
    >
      <div
        style={{
          width:        dim.width,
          height:       dim.height,
          border:       `${dim.border}px solid rgba(79,172,254,0.25)`,
          borderTop:    `${dim.border}px solid #4facfe`,
          borderRadius: "50%",
          animation:    "_spin 0.75s linear infinite",
          flexShrink:   0,
        }}
      />
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  wrapper: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:            "10px",
  },
  message: {
    margin:     0,
    fontSize:   "13px",
    color:      "#666",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
};

export default LoadingSpinner;
