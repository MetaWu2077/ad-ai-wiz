import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

/**
 * Wrapper that bridges React Router navigate() to s-button native click events.
 * 
 * Problem: s-button is a native Web Component wrapped in Shadow DOM.
 * React's synthetic onClick doesn't reliably fire across Shadow DOM boundaries.
 * Solution: use addEventListener on the native DOM element to catch the browser's
 * native click event, then call navigate() programmatically.
 * 
 * This lets us keep using Polaris Web Components (s-button) for consistent styling
 * while ensuring 100% reliable SPA navigation via React Router.
 */
export function SButtonLink({ to, variant = "default", children }) {
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleNativeClick = (e) => {
      e.preventDefault(); // stop default navigation behavior
      navigate(to);
    };

    button.addEventListener("click", handleNativeClick);
    return () => button.removeEventListener("click", handleNativeClick);
  }, [to, navigate]);

  return (
    <s-button ref={buttonRef} variant={variant}>
      {children}
    </s-button>
  );
}
