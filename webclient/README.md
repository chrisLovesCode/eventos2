# nt

Modern event management platform frontend built with **Next.js 16** and **TypeScript**.

## ch Stack

- **Framework**: Next.js 16.1.5 (App Router, SSR)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **React**: React 19 with Server Components
- **Build Tool**: Turbopack
- **Fonts**: Geist (Google Fonts)
- **Container**: Docker

## s

### s
- React Compiler für automatische Performance-Optimierung
- Server Components als Standard
- Strikte TypeScript-Konfiguration
- Type-safe API Client
- Vollständige Error Boundaries
- Loading States
- SEO-optimierte Metadata API
- Security Headers
- Image Optimization (AVIF, WebP)
- Deutsche Lokalisierung

### s
- Hot Module Replacement
- Path Aliases (`@/*`)
- Environment Variables
- ESLint + TypeScript Strict Mode
- Custom Fetch Wrapper mit Timeout
- Utility Functions (Date Formatting, Class Merging)

## nt

### cklung
```bash
npm run dev
```
Öffne [http://localhost:3001](http://localhost:3001)

### nt
```bash
# n
docker compose up -d webclient

# n
docker logs -f eventos2_webclient

# ll
docker exec -it eventos2_webclient sh
```

### n
```bash
npm run build
npm start
```

## ktstruktur

```
webclient/
├── src/
│   ├── app/              # App Router Pages
│   │   ├── layout.tsx    # Root Layout mit Metadata
│   │   ├── page.tsx      # Homepage
│   │   ├── loading.tsx   # Global Loading State
│   │   ├── error.tsx     # Error Boundary
│   │   └── not-found.tsx # 404 Page
│   └── lib/              # Shared Utilities
│       ├── api.ts        # Type-safe API Client
│       └── utils.ts      # Helper Functions
├── public/               # Static Assets
├── .env.local           # Environment Variables
└── next.config.ts       # Next.js Configuration
```

## n

Der API Client ist vollständig typisiert und nutzt die Backend DTOs:

```typescript
import { api } from "@/lib/api";

// n
const events = await api.events.getAll();

// n
const newEvent = await api.events.create({
  name: "Mein Event",
  slug: "mein-event",
  dateStart: "2026-02-01T10:00:00Z",
});
```

## s

Kopiere `.env.local.example` zu `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=30000
NODE_ENV=development
```

## pts

```bash
npm run dev          # Development Server (Port 3000)
npm run build        # Production Build
npm start            # Production Server
npm run lint         # ESLint Check
```

## r

Der Webclient läuft in einem Docker Container mit:
- Hot Reload über Volume Mounting
- Health Checks
- Multi-Stage Build für Production
- Optimiertes Layer Caching

Port Mapping: `3001:3000` (Host:Container)

## n

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Best Practices Checklist](./BEST_PRACTICES.md)

## ps

1. Implementiere Event-Listing Page
2. Füge Authentication hinzu
3. Erstelle Event-Detail Pages
4. Implementiere Event-Formular
5. Füge UI Component Library hinzu (shadcn/ui)
6. Setup Testing (Vitest + Playwright)

## nks

- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:3001`
- API Docs: `http://localhost:3000/api`
