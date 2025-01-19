import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DevToolsBlocker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent F12 key
      if (e.keyCode === 123) {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+I (Windows) and Command+Option+I (Mac)
      if (
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
        (e.metaKey && e.altKey && e.keyCode === 73)
      ) {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+C (Windows) and Command+Option+C (Mac)
      if (
        (e.ctrlKey && e.shiftKey && e.keyCode === 67) ||
        (e.metaKey && e.altKey && e.keyCode === 67)
      ) {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+J (Windows) and Command+Option+J (Mac)
      if (
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
        (e.metaKey && e.altKey && e.keyCode === 74)
      ) {
        e.preventDefault();
      }

      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
      }
    };

    let isDevToolsOpen = false;

    // Detect DevTools using debugger timing
    const detectDevTools = (allow = 100) => {
      const start = +new Date();
      debugger;
      const end = +new Date();

      if (isNaN(start) || isNaN(end) || end - start > allow) {
        if (!isDevToolsOpen) {
          isDevToolsOpen = true;
          navigate("/dev-tools-blocked");
        }
      } else {
        isDevToolsOpen = false;
      }
    };

    // Initialize detection on component mount
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      detectDevTools();
    }

    // Add event listeners for various triggers
    window.addEventListener("resize", () => detectDevTools());
    window.addEventListener("mousemove", () => detectDevTools());
    window.addEventListener("focus", () => detectDevTools());
    window.addEventListener("blur", () => detectDevTools());

    // Add keyboard and context menu prevention
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("resize", detectDevTools);
      window.removeEventListener("mousemove", detectDevTools);
      window.removeEventListener("focus", detectDevTools);
      window.removeEventListener("blur", detectDevTools);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return null;
};

export default DevToolsBlocker;
