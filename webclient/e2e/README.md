# Playwright E2E Tests

## Setup

Die E2E-Tests verwenden Playwright und testen die vollständige User-Journey von Registrierung bis Event-Management.

### Installation

```bash
npm install
npx playwright install chromium
```

## Tests ausführen

### Auf Production (Standard)
```bash
npm run test:e2e
```

### Auf Local
```bash
npm run test:e2e:local
```

### Mit UI (Interactive Mode)
```bash
npm run test:e2e:ui
```

### Mit Browser-Anzeige (Headed Mode)
```bash
npm run test:e2e:headed
```

## Test-Szenarien

Der `user-journey.spec.ts` Test deckt folgende Schritte ab:

1. **Registrierung** - Neuer User mit `chrisvaupel+e2etest_XXXXX@gmail.com`
2. **E-Mail-Verifikation** - Automatisch via Backend-API
3. **Login** - Mit verifiziertem User
4. **Event erstellen** - Mit allen Feldern und Banner-Upload
5. **Event anzeigen** - Verifikation der Event-Details
6. **Event bearbeiten** - Änderung von Name und Beschreibung
7. **Logout** - User abmelden
8. **Passwort vergessen** - Reset-Flow testen

## Umgebungsvariablen

- `E2E_BASE_URL` - Frontend URL (default: `https://eventos.chrisvaupel.de`)
- `E2E_API_URL` - Backend API URL (default: `https://eventos.chrisvaupel.de/api`)

## Backend-Anforderungen

Für die automatische E-Mail-Verifikation wird ein Admin-Endpoint benötigt:

```
POST /admin/test/verify-user
Body: { "email": "user@example.com" }
```

Dieser Endpoint sollte nur in Test-Umgebungen aktiviert sein und den User direkt verifizieren.

## Reports

Nach dem Test-Lauf wird ein HTML-Report generiert:

```bash
npx playwright show-report
```

## Debugging

```bash
# Mit Debug-Modus
npx playwright test --debug

# Einzelnen Test ausführen
npx playwright test user-journey.spec.ts

# Mit Trace-Viewer
npx playwright show-trace trace.zip
```
