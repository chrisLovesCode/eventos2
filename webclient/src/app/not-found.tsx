import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl text-muted-foreground">Seite nicht gefunden</h2>
      <Link
        href="/"
        className="glass-button"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
