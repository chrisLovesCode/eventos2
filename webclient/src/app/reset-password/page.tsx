import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Passwort zurücksetzen',
  description: 'Setze ein neues Passwort für dein Konto',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-sidebar p-8 shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Neues Passwort setzen
            </h1>
            <p className="text-muted-foreground">
              Gib dein neues Passwort ein
            </p>
          </div>

          <Suspense fallback={<div className="text-center">Lädt...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
