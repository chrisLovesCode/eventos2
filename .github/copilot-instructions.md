# s2

## cht

**Eventos2** ist eine Event-Management-Plattform mit NestJS Backend API und PostgreSQL Datenbank.

### ch Stack
- **Backend**: NestJS 11, TypeScript
- **ORM**: Prisma 6.19
- **Datenbank**: PostgreSQL 16
- **Auth**: JWT mit passport-jwt
- **Testing**: Jest, Supertest (E2E)
- **Container**: Docker Compose
- **Validation**: class-validator, class-transformer

## s

### ktur

#### r
```typescript
// ✅ Gut
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
export class EventsController {
  @Post()
  @Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
  async create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(dto, user.userId);
  }
}

//  DTO
async create(@Body() dto: CreateEventDto) {
  return this.service.create(dto); // userId fehlt!
}
```

#### r
```typescript
// ns
if (!event) {
  throw new NotFoundException(`Event with ID ${id} not found`);
}
if (existingSlug) {
  throw new ConflictException(`Slug '${slug}' already exists`);
}

// r
if (!event) throw new Error('Not found');
```

#### DTOs
```typescript
// rung
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty()
  name: string;
}

// rung
export class CreateEventDto {
  name: string;
}
```

### n

#### ln
- **userId IMMER aus JWT extrahieren** - nie manuell im Request-Body
- **CurrentUser Decorator verwenden** für authenticated User
- **Guards in dieser Reihenfolge**: JwtAuthGuard → RolesGuard → ResourceOwnerGuard
- **@Public() Decorator** für öffentliche Endpoints

#### 
```typescript
// n
// n
// n

@Delete(':id')
@Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
@ResourceOwner() // Prüft Ownership außer für ADMIN
```

### n

#### ln
1. **Slug muss eindeutig sein** - ConflictException (409) bei Duplikat
2. **dateEnd > dateStart** - BadRequestException (400) wenn verletzt
3. **userId automatisch setzen** - aus JWT Token des eingeloggten Users
4. **Admins können Events reassignen** - userId optional in UpdateEventDto

#### 
```typescript
// 
POST /events
- Body: { name, slug, dateStart, dateEnd, description }
- userId wird automatisch aus JWT gesetzt
- 201 Created oder 409 Conflict (slug exists)

// 
PATCH /events/:id
- Nur Owner, Moderator oder Admin
- Datums-Validierung auch bei partiellen Updates
- 200 OK, 403 Forbidden, 404 Not Found, 409 Conflict

// 
DELETE /events/:id
- Nur Owner, Moderator oder Admin
- 204 No Content
```

### ng

#### sts
```typescript
// sts
afterAll(async () => {
  await cleanup();
  await app.close();
});

// n
const testUserEmail = 'testuser@example.dev';
const testUserPassword = 'changeMe';

// sts
const response = await request(app.getHttpServer())
  .post('/events')
  .set('Authorization', `Bearer ${token}`)
  .send(data)
  .expect(201);
```

#### n
- **Testuser**: testuser@example.dev / changeMe (Rolle: USER)
- **Admin**: Aus .env (ADMIN_EMAIL / ADMIN_PASSWORD)
- **Cleanup**: Lösche Test-Daten nach jedem Test
- **Assertions**: Prüfe Response-Body vollständig

### nbank

#### w
```bash
# n
docker-compose exec api npm run prisma:migrate

# n
# n.sql
```

#### s
```typescript
// s
const event = await this.prisma.event.findUnique({
  where: { id },
  include: {
    user: includeUser ? {
      select: { id: true, email: true, nick: true, role: true }
    } : false,
  },
});

// n
const event = await this.prisma.event.findUnique({
  where: { id },
  include: { user: true },
});
```

### rs

```typescript
// s
async findAll(
  @Query('includeUser', new DefaultValuePipe(false), ParseBoolPipe)
  includeUser: boolean,
) {}

// ng
async findAll(@Query('includeUser') includeUser?: string) {
  const include = includeUser === 'true'; // ❌
}
```

### s

Verwende konsistent diese HTTP Status Codes:

- **200 OK** - Erfolgreiche GET/PATCH Requests
- **201 Created** - Erfolgreiche POST Requests (Ressource erstellt)
- **204 No Content** - Erfolgreiche DELETE Requests
- **400 Bad Request** - Validierungsfehler, ungültige Daten
- **401 Unauthorized** - Fehlende/ungültige Authentication
- **403 Forbidden** - Keine Berechtigung für diese Aktion
- **404 Not Found** - Ressource nicht gefunden
- **409 Conflict** - Konflikt (z.B. eindeutiger Constraint verletzt)

### rns

```typescript
//  Grund
function process(data: any) { }

// 
class CreateDto {
  userId?: string; // ❌ Sicherheitsrisiko!
}

// 
if (slugExists) {
  slug = `${slug}-${nanoid()}`; // ❌ Intransparent
}

// 
@Query('active') active?: string // ❌

// rung
if (dateStart && dateEnd) { // ❌ Was wenn nur eins gesetzt?
  validate();
}
```

## w

### )
```bash
make up                  # Container starten
make down               # Container stoppen
make api-shell          # API Container Shell
make db-migrate         # Prisma Migrationen
make db-studio          # Prisma Studio öffnen
make api-test-e2e       # E2E Tests ausführen
```

###  Tasks

#### ln
1. Branch erstellen
2. DTOs mit Validierung definieren
3. Service-Methode implementieren
4. Controller-Endpoint mit Guards
5. E2E Tests schreiben
6. Tests ausführen: `make api-test-e2e`

#### rn
1. `api/prisma/schema.prisma` editieren
2. Migration: `make db-migrate`
3. Prisma Client regenerieren (automatisch)
4. DTOs anpassen wenn nötig

## kt-Struktur

```
api/
├── prisma/
│   ├── schema.prisma          # Datenbank-Schema
│   └── migrations/            # SQL Migrationen
├── src/
│   ├── auth/                  # Authentication & Guards
│   │   ├── guards/           # JWT, Roles, ResourceOwner
│   │   ├── decorators/       # CurrentUser, Roles, Public
│   │   └── strategies/       # JWT Strategy
│   ├── events/               # Events Domain
│   │   ├── dto/             # DTOs mit Validierung
│   │   ├── entities/        # TypeScript Entities
│   │   ├── events.controller.ts
│   │   └── events.service.ts
│   ├── admin/               # Admin-spezifische Funktionen
│   ├── common/              # Shared Code
│   └── main.ts              # App Bootstrap
└── test/                     # E2E Tests
    ├── events.e2e-spec.ts
    └── auth.e2e-spec.ts
```

## n

Definiert in `.env.local` / `.env.example`:

```bash
# 
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/eventos2_db

# JWT
JWT_SECRET=your-secret-key-change-in-production

# r
ADMIN_EMAIL=admin@example.dev
ADMIN_PASSWORD=changeMe

# r
TEST_USER_EMAIL=testuser@example.dev
TEST_USER_PASSWORD=changeMe
```

## n

1. **Security First** - Immer Guards und Validierung
2. **Type Safety** - Nutze TypeScript vollständig
3. **Consistent Errors** - Spezifische NestJS Exceptions
4. **Test Coverage** - E2E Tests für alle Endpoints
5. **Documentation** - Swagger Decorators für API Docs
6. **Clean Code** - DRY, SOLID, klare Naming

## n

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [class-validator](https://github.com/typestack/class-validator)
