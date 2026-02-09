'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { EventForm } from '@/components/events/EventForm/EventForm';
import { Header } from '@/components/layout';

export default function EventCreatePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!data?.authenticated) {
          router.replace('/login?redirect=/events/create');
          return;
        }
        setIsAuthenticated(true);
      } catch {
        router.replace('/login?redirect=/events/create');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            Zurück zu Events
          </Link>
        </div>
        <article className="card-sidebar p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Neues Event erstellen
          </h1>
          <EventForm mode="create" />
        </article>
      </main>
    </div>
  );
}
