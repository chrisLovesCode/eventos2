"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TextInput } from "@/components/forms";
import { Button } from "@/components/commons";

interface LoginCardProps {
  onSuccess?: (accessToken: string) => void;
  redirectTo?: string;
}

export function LoginCard({ onSuccess, redirectTo = "/" }: LoginCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login fehlgeschlagen");
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.access_token);
      }

      // Force full page reload to ensure everything is set
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-sidebar w-full max-w-md p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Anmelden
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Melde dich mit deinem Account an
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="status-error">
            <p>{error}</p>
          </div>
        )}

        <TextInput
          id="email"
          name="email"
          label="E-Mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="deine@email.de"
          required
          disabled={isLoading}
        />

        <TextInput
          id="password"
          name="password"
          label="Passwort"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          minLength={8}
          disabled={isLoading}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Wird angemeldet..." : "Anmelden"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Noch kein Account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Jetzt registrieren
          </Link>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
            Passwort vergessen?
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
 Diese Seite ist eine fiktionale Anwendung ohne echte Termine und dient nur zu Demonstrationszwecken.
        </p>
      </div>
    </div>
  );
}
