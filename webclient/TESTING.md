# Webclient Snapshot Tests - Best Practice 2025

## Setup

Das Projekt verwendet die modernsten Testing-Libraries für Next.js 16:

- **@testing-library/react** ^16 - React Testing Library für Next.js 16
- **@testing-library/jest-dom** ^6 - Custom Jest Matcher
- **@testing-library/user-event** ^14 - User Interaction Simulation
- **jest** ^29 mit **jest-environment-jsdom** ^29
- **@types/jest** ^29 - TypeScript Support

## Konfiguration

### jest.config.js
- Next.js Integration mit `next/jest`
- jsdom Environment für Browser-APIs
- Module Path Mapping (`@/` → `src/`)
- Coverage Collection konfiguriert

### jest.setup.js
- `@testing-library/jest-dom` importiert
- `window.matchMedia` Mock
- `IntersectionObserver` Mock
- `ResizeObserver` Mock

## Test-Struktur

```
src/components/
├── commons/
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── __tests__/
│       ├── Button.test.tsx
│       └── Modal.test.tsx
└── events/
    └── eventListings/
        ├── EventCard.tsx
        ├── CategoryFilter.tsx
        └── __tests__/
            ├── EventCard.test.tsx
            └── CategoryFilter.test.tsx
```

## Test-Patterns

### 1. Snapshot Tests
```typescript
it('should match snapshot with default props', () => {
  const { container } = render(<Button>Click me</Button>)
  expect(container.firstChild).toMatchSnapshot()
})
```

**Best Practice 2025:**
- Teste alle relevanten Props-Kombinationen
- Nutze aussagekräftige Test-Namen
- Snapshot nur das direkte Element (`.firstChild`)

### 2. Behavior Tests
```typescript
it('should call onClick handler', () => {
  const handleClick = jest.fn()
  const { getByText } = render(<Button onClick={handleClick}>Click</Button>)
  getByText('Click').click()
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

**Best Practice 2025:**
- Teste User-Interaktionen
- Verwende semantische Queries (`getByText`, `getByRole`)
- Prüfe Accessibility

### 3. Next.js Mocks
```typescript
// Image Mock
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props
    return <img {...rest} />
  },
}))

// Navigation Mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
```

**Best Practice 2025:**
- Mocke Next.js spezifische Components
- Extrahiere fill-Prop bei Image (verhindert Warnings)
- Nutze TypeScript für Type Safety

### 4. Icon Mocks
```typescript
// FontAwesome Mock
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <i data-testid="font-awesome-icon" {...props} />
  ),
}))

// Lucide React Mock
jest.mock('lucide-react', () => ({
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  MapPin: (props: any) => <div data-testid="map-pin-icon" {...props} />,
}))
```

## Test-Ergebnisse

✅ **4 Test Suites** passed
✅ **60 Tests** passed
✅ **34 Snapshots** passed
⏱️ **Time:** 0.684s

## Coverage

Aktuell getestete Components:
- ✅ Button (13 Snapshots + 6 Behavior Tests)
- ✅ Modal (7 Snapshots + 8 Behavior Tests)
- ✅ EventCard (7 Snapshots + 9 Behavior Tests)
- ✅ CategoryFilter (8 Snapshots + 4 Behavior Tests)

## NPM Scripts

```bash
npm test              # Tests ausführen
npm run test:watch    # Watch-Modus
npm run test:coverage # Mit Coverage-Report
```

## Best Practices 2025 - Checklist

✅ **React Testing Library** statt Enzyme
✅ **jsdom** Environment für Browser APIs
✅ **Semantic Queries** (`getByRole`, `getByText`)
✅ **User Event API** für Interaktionen
✅ **Snapshot Tests** für UI-Regression
✅ **Behavior Tests** für Business Logic
✅ **Next.js Mocking** für Image, Navigation
✅ **TypeScript** für Type Safety
✅ **Fast Tests** (<1s für alle Tests)
✅ **Isolierte Tests** (keine Abhängigkeiten)

## Nächste Schritte

1. **Auth Components** - LoginCard, RegisterCard testen
2. **Form Components** - EventForm, EventSearchForm testen
3. **E2E Tests** - Mit Playwright für kritische User Flows
4. **Visual Regression** - Mit Percy oder Chromatic
5. **Coverage Target** - 80%+ für kritische Components
