import { STORAGE_KEY } from "@/lib/quiz-progress";

/**
 * The one place the quiz touches `localStorage`. Every access is wrapped: in a private
 * window, with site data blocked, or over quota, storage can throw, and the quiz must
 * carry on. Progress is then kept in memory for the visit and simply not saved.
 *
 * It is an external store (read through `useSyncExternalStore`) so a reload restores
 * progress after hydration without a setState in an effect, and the server render, which
 * has no storage, matches the first client render.
 */
let memory: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const emit = () => listeners.forEach((l) => l());

export function getSnapshot(): string {
  if (!loaded) {
    memory = readStorage();
    loaded = true;
  }
  return memory ?? "";
}

export const getServerSnapshot = () => "";

export function saveRaw(raw: string | null): void {
  memory = raw;
  loaded = true;
  try {
    if (raw === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Blocked or full: the in-memory copy still serves this visit.
  }
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changed the saved progress.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      memory = readStorage();
      loaded = true;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
