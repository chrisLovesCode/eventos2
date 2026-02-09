import { EventList } from "@/components/events/eventListings/EventList";
import { EventSearchForm } from "@/components/events/eventListings/EventSearchForm";
import { Header, Footer } from "@/components/layout";
import { NewsletterSignupButton } from "@/components/home/NewsletterSignupButton";
import { BRAND_NAME } from "@/lib/brand";

interface HomeProps {
  searchParams: Promise<{ 
    page?: string; 
    categorySlugs?: string;
    search?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const categorySlugs = params.categorySlugs
    ? params.categorySlugs.split(",").filter(Boolean)
    : [];
  const searchQuery = params.search || "";
  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-transparent">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/bg-vr.png')", backgroundAttachment: "fixed" }}
          />
          <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-background/80 to-surface" />
          <div className="absolute -right-20 top-10 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-80 w-80 animate-pulse rounded-full bg-muted/40 blur-3xl" />
          <div className="absolute left-16 top-12 h-6 w-6 animate-float-drift-fast rounded-full bg-white/50 blur-[1px] shadow-[0_0_18px_rgba(255,255,255,0.45)]" style={{ animationDelay: "0.2s" }} />
          <div className="absolute right-24 top-24 h-5 w-5 animate-float-drift rounded-[var(--radius-input)] bg-primary/45 blur-[1px] shadow-[0_0_16px_rgba(59,130,246,0.5)]" style={{ animationDelay: "0.6s" }} />
          <div className="absolute right-40 bottom-16 h-7 w-7 animate-float-drift-slow rounded-full bg-muted/45 blur-[2px] shadow-[0_0_18px_rgba(148,163,184,0.45)]" style={{ animationDelay: "0.1s" }} />
          <div className="absolute left-1/3 bottom-10 h-4 w-4 animate-float-drift rounded-full bg-white/55 blur-[1px] shadow-[0_0_14px_rgba(255,255,255,0.45)]" style={{ animationDelay: "0.4s" }} />
          <div className="absolute left-24 bottom-28 h-6 w-6 animate-float-drift-fast rotate-12 rounded-[var(--radius-input)] bg-primary/40 blur-[1px] shadow-[0_0_16px_rgba(59,130,246,0.45)]" style={{ animationDelay: "0.8s" }} />
          <div className="absolute right-1/3 top-10 h-4 w-4 animate-float-drift rounded-full bg-surface/40 blur-[1px] shadow-[0_0_12px_rgba(255,255,255,0.35)]" style={{ animationDelay: "1s" }} />
          <div className="absolute right-12 top-40 h-3 w-3 animate-float-drift-slow rounded-full bg-white/45 blur-[1px] shadow-[0_0_12px_rgba(255,255,255,0.4)]" style={{ animationDelay: "0.3s" }} />
          <div className="absolute left-1/2 top-8 h-5 w-5 animate-float-drift-fast rounded-full bg-primary/35 blur-[2px] shadow-[0_0_16px_rgba(59,130,246,0.4)]" style={{ animationDelay: "0.5s" }} />
          <div className="absolute left-12 bottom-12 h-4 w-4 animate-float-drift rounded-[var(--radius-input)] bg-muted/40 blur-[1px] shadow-[0_0_14px_rgba(148,163,184,0.45)]" style={{ animationDelay: "0.7s" }} />
          <div className="absolute right-28 bottom-6 h-6 w-6 animate-float-drift-slow rounded-full bg-white/40 blur-[2px] shadow-[0_0_18px_rgba(255,255,255,0.35)]" style={{ animationDelay: "0.9s" }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-34">
          <div className="max-w-2xl animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Entdecke die besten <span className="text-white">Tech-Events</span>
            </h2>
            <p className="mt-4 hero-text">
              Bleibe auf dem Laufenden über die neuesten Technologien,
              Konferenzen und Meetups in deiner Region.
            </p>

            <EventSearchForm searchQuery={searchQuery} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" id="events">
        <div className="mb-6 flex animate-fade-in-up items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand">
              {searchQuery ? `Suchergebnisse` : "Kommende Events"}
            </h2>
            <p className="mt-2 text-sm text-brand">
              {searchQuery 
                ? `Ergebnisse für "${searchQuery}"` 
                : "Entdecke die neuesten Events und Veranstaltungen"
              }
            </p>
          </div>
        </div>

        <div className="animate-fade-in animate-delay-100">
          <EventList
            page={page}
            limit={10}
            categorySlugs={categorySlugs}
            searchQuery={searchQuery}
            layout="grid"
            showFilters={true}
          />
        </div>

        {!searchQuery && (
          <>
            <section className="mt-12 animate-fade-in-up animate-delay-250" id="about">
              <div className="card-sidebar card-hover px-6 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 id="about" className="text-xl font-semibold text-foreground">Hinweis</h3>
                    <p className="mt-3 text-lg font-semibold leading-relaxed text-foreground">
                      ACHTUNG: Der Inhalt dieser Seite ist fiktiv. Es handelt sich um Demo-Inhalte dieses Event-Systems.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-12 animate-fade-in-up animate-delay-300" id="blog">
              <div className="card-sidebar card-hover px-6 py-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="hover-scale icon-tile">
                      <svg
                        className="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        Newsletter abonnieren
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Erhalte die neuesten Event-Updates direkt in dein Postfach.
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      placeholder="E-Mail-Adresse"
                      className="input-surface"
                    />
                    <NewsletterSignupButton />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
