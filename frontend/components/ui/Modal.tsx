"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/** A pop-up built on the browser's own <dialog>: it traps focus, closes with Esc and returns focus when closed. */
export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(); // click on the dark backdrop
      }}
      className={clsx(
        "m-auto w-[calc(100%-2rem)] rounded-card bg-surface p-0 text-ink backdrop:bg-ink/60",
        wide ? "max-w-2xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <h2 id={titleId} className="mb-4 font-display text-2xl font-bold uppercase">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}