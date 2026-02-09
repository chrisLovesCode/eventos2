'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TextInput } from '../forms';
import { Button } from '@/components/commons';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    nick: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!formData.email.includes('@')) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (formData.nick.length < 3 || formData.nick.length > 30) {
      newErrors.nick = 'Benutzername muss zwischen 3 und 30 Zeichen lang sein';
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.nick)) {
      newErrors.nick = 'Nur Buchstaben, Zahlen, Unterstriche und Bindestriche erlaubt';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Passwort muss Groß-, Kleinbuchstaben und eine Zahl enthalten';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          nick: formData.nick.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message) {
          if (Array.isArray(data.message)) {
            data.message.forEach((msg: string) => {
              if (msg.includes('email')) newErrors.email = msg;
              else if (msg.includes('nick')) newErrors.nick = msg;
              else if (msg.includes('password')) newErrors.password = msg;
            });
          } else {
            newErrors.general = data.message;
          }
        }
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        data.message || 
        'Registrierung erfolgreich! Wir haben dir einen Bestätigungslink per E-Mail geschickt. Bitte überprüfe dein Postfach (auch den Spam-Ordner).'
      );
      
      if (onSuccess) {
        onSuccess();
      }
      // Don't auto-redirect - user needs to verify email first
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Netzwerkfehler. Bitte versuche es erneut.' });
    } finally {
      setIsLoading(false);
    }
  };

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
        id="email"
        name="email"
        label="E-Mail"
        type="email"
        value={formData.email}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, email: value }));
          setErrors((prev) => ({ ...prev, email: '' }));
        }}
        placeholder="deine@email.de"
        required
        disabled={isLoading || !!successMessage}
        error={errors.email}
      />

      <TextInput
        id="nick"
        name="nick"
        label="Benutzername"
        value={formData.nick}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, nick: value }));
          setErrors((prev) => ({ ...prev, nick: '' }));
        }}
        placeholder="benutzername"
        required
        minLength={3}
        maxLength={30}
        disabled={isLoading || !!successMessage}
        error={errors.nick}
        hint="Nur Buchstaben, Zahlen, Unterstriche und Bindestriche"
      />

      <TextInput
        id="password"
        name="password"
        label="Passwort"
        type="password"
        value={formData.password}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, password: value }));
          setErrors((prev) => ({ ...prev, password: '' }));
        }}
        placeholder="Min. 8 Zeichen"
        required
        minLength={8}
        disabled={isLoading || !!successMessage}
        error={errors.password}
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
        {isLoading ? 'Registrierung läuft...' : 'Registrieren'}
      </Button>

      {!successMessage && (
        <p className="text-center text-sm text-muted-foreground">
          Bereits registriert?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Jetzt anmelden
          </Link>
        </p>
      )}
    </form>
  );
}
