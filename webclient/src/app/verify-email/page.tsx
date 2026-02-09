'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Kein Verifikations-Token gefunden.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.message || 'Verifikation fehlgeschlagen.');
          return;
        }

        setStatus('success');
        setMessage('E-Mail erfolgreich verifiziert! Du wirst weitergeleitet...');

        // Redirect to dashboard/home after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Netzwerkfehler. Bitte versuche es erneut.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-sidebar p-8 shadow-md">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <h1 className="text-2xl font-bold text-foreground mb-2">E-Mail wird verifiziert...</h1>
                <p className="text-muted-foreground">Bitte warten</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="status-icon-success mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">E-Mail verifiziert!</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="status-icon-error mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Verifikation fehlgeschlagen</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Link
                  href="/login"
                  className="glass-button"
                >
                  Zur Anmeldung
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
