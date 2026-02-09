'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TextInput } from '../forms';
import { Button } from '@/components/commons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!token) {
      newErrors.general = 'Ungültiger Reset-Link. Bitte fordere einen neuen an.';
    }

    if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Passwort muss Groß-, Kleinbuchstaben und eine Zahl enthalten';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token?.trim(),
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message) {
          newErrors.general = data.message;
        }
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        'Passwort erfolgreich zurückgesetzt! Du wirst zur Anmeldung weitergeleitet...'
      );

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ general: 'Netzwerkfehler. Bitte versuche es erneut.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="status-error">
          Ungültiger oder fehlender Reset-Link. Bitte fordere einen neuen Link an.
        </div>
        <div className="text-center">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="status-error">
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div className="status-success">
          {successMessage}
        </div>
      )}

      <TextInput
        id="newPassword"
        name="newPassword"
        label="Neues Passwort"
        type="password"
        value={formData.newPassword}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, newPassword: value }));
          setErrors((prev) => ({ ...prev, newPassword: '' }));
        }}
        placeholder="Min. 8 Zeichen"
        required
        minLength={8}
        disabled={isLoading || !!successMessage}
        error={errors.newPassword}
        hint="Muss Groß-, Kleinbuchstaben und eine Zahl enthalten"
      />

      <TextInput
        id="confirmPassword"
        name="confirmPassword"
        label="Passwort bestätigen"
        type="password"
        value={formData.confirmPassword}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, confirmPassword: value }));
          setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }}
        placeholder="Passwort wiederholen"
        required
        disabled={isLoading || !!successMessage}
        error={errors.confirmPassword}
      />

      <Button
        type="submit"
        disabled={isLoading || !!successMessage}
        className="w-full"
      >
        {isLoading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          Zurück zur Anmeldung
        </Link>
      </div>
    </form>
  );
}
