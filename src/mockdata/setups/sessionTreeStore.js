/**
 * Shared sessionStorage-backed tree store.
 * Uses window so Vite HMR / dual imports cannot fork in-memory copies.
 */

export function createSessionTreeStore({
  storageKey,
  eventName,
  windowKey,
  getSeed,
  clone,
}) {
  function read() {
    if (typeof sessionStorage === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed == null ? null : clone(parsed);
    } catch {
      return null;
    }
  }

  function write(value) {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  function getBucket() {
    if (typeof window === "undefined") {
      return { value: null, revision: 0 };
    }
    if (!window[windowKey]) {
      const stored = read();
      window[windowKey] = {
        value: stored != null ? stored : clone(getSeed()),
        revision: 0,
      };
    }
    return window[windowKey];
  }

  function notify() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(eventName));
  }

  return {
    eventName,
    get() {
      const bucket = getBucket();
      return clone(bucket.value);
    },
    set(next) {
      const bucket = getBucket();
      bucket.value = clone(next);
      bucket.revision += 1;
      write(bucket.value);
      notify();
      return clone(bucket.value);
    },
    revision() {
      return getBucket().revision;
    },
    reset() {
      return this.set(getSeed());
    },
  };
}
