"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
}

export function Modal({
  open,
  title,
  description,
  confirmText = "Bestätigen",
  cancelText = "Abbrechen",
  isLoading = false,
  onConfirm,
  onCancel,
  children,
  showConfirmButton = true,
  showCancelButton = true,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!open || !isMounted) return null;

  const shouldShowActions = showCancelButton || showConfirmButton;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4">
      <div className="modal-card">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {children}
        {shouldShowActions && (
          <div className="mt-6 flex justify-end gap-3">
            {showCancelButton && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            )}
            {showConfirmButton && (
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Löschen..." : confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
