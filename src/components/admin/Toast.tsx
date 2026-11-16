"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastApi = { show: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi | null>(null);

const TONE: Record<ToastTone, string> = {
  success: "border-l-primary",
  error: "border-l-admin-danger",
  info: "border-l-admin-info-text",
};

/** Penyedia toast. Region aria-live selalu ada di DOM agar pesan baru diumumkan pembaca layar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), tone === "error" ? 8000 : 5000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-60 flex flex-col items-end gap-2 sm:left-auto"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-admin border border-l-4 border-admin-line bg-white py-2 pl-4 pr-1 text-sm font-semibold text-admin-ink shadow-admin-card ${TONE[t.tone]}`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-admin-text hover:bg-admin-canvas focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error(
      "useToast harus dipakai di dalam <ToastProvider> (AdminShell).",
    );
  return ctx;
}
