'use client';

import { useState } from "react";
import { Button } from "@/components/commons";
import { Modal } from "@/components/commons/Modal";

export function NewsletterSignupButton() {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  return (
    <>
      <Button type="button" className="hover-lift" onClick={() => setOpen(true)}>
        Jetzt registrieren
      </Button>
      <Modal
        open={open}
        onCancel={handleClose}
        onConfirm={handleClose}
        title="Newsletter-Demo"
        cancelText="Schließen"
        confirmText="Okay"
        showConfirmButton={false}
      >
        <p className="mt-4 text-base font-semibold leading-relaxed text-foreground">
Danke für dein Interese, aber diese Seite ist fiktional und eine Technik-Demo 😊        </p>
      </Modal>
    </>
  );
}
