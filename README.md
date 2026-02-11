# Eventos (TechEvents)

Demo: Die Anwendung ist mit Dummy-Daten unter [https://eventos.chrisvaupel.de](https://eventos.chrisvaupel.de) live verfuegbar.
Ein Cronjob setzt diese nachts automatisch auf die Demo-Daten zurück.

**Tech-Stack**
- Backend: NestJS (Node.js, TypeScript), Prisma, PostgreSQL
- Frontend: Next.js (React, TypeScript), Tailwind CSS
- Infrastruktur: Docker Compose, Nginx
- Tests: Jest (Unit/Snapshot), Playwright (E2E)

**Features**
- Auth: Registrierung, Login/Logout, E-Mail-Verifizierung, Passwort-Reset
- Session-Handling: JWT via `httpOnly` Cookies mit Refresh-Token-Rotation
- Rollen/Rechte: Admin/Moderator/User, Resource-Owner-Checks
- Events: Role based CRUD, Kategorien, Suche/Filter, Pagination/Infinite Scroll
- Standortsuche: PLZ/Radius (Geocoding)
- Dateien: Event-Banner-Upload
- Publishing: Unveroeffentlicht sichtbar fuer Owner sowie Admin/Moderator; Publish/Unpublish nur fuer Admin/Moderator
