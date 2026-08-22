import { useEffect, useState } from "react";

/**
 * Re-render when a setup tree store notifies (sibling reorder, save, reset).
 * @param {string} eventName
 */
export function useSetupTreeRevision(eventName) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!eventName || typeof window === "undefined") return undefined;
    const bump = () => setRevision((n) => n + 1);
    window.addEventListener(eventName, bump);
    return () => window.removeEventListener(eventName, bump);
  }, [eventName]);

  return revision;
}
