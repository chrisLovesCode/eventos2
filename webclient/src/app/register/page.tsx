import { RegisterForm } from '@/components/auth/RegisterForm';
import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Registrierung',
  description: `Erstelle ein kostenloses ${BRAND_NAME} Konto`,
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-sidebar p-8 shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {BRAND_NAME}
            </h1>
            <p className="text-muted-foreground">
              Erstelle dein kostenloses Konto
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
