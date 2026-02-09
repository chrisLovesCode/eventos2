'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TextInput } from '../forms';
import { Button } from '@/components/commons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Client-side validation
    if (!email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ein Fehler ist aufgetreten');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        data.message || 
        'Falls die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet. Bitte überprüfe dein Postfach.'
      );
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="status-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="status-success">
          {successMessage}
        </div>
      )}

      <TextInput
        id="email"
        name="email"
        label="E-Mail-Adresse"
        type="email"
        value={email}
        onChange={(value) => {
          setEmail(value);
          setError('');
        }}
        placeholder="deine@email.de"
        required
        disabled={isLoading || !!successMessage}
        error={error}
      />

      <Button
        type="submit"
        disabled={isLoading || !!successMessage}
        className="w-full"
      >
        {isLoading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          Zurück zur Anmeldung
        </Link>
      </div>
    </form>
  );
}
