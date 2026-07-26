# Struktur Project Renjana

Dokumen ini menjelaskan struktur folder lengkap project Renjana untuk membantu team memahami organisasi codebase.

## Overview Struktur

```txttxt
Renjana (Root)
├── apps/                 ← Aplikasi utama (Frontend + Backend)
├── packages/             ← Shared code dan utilities
├── docs/                 ← Dokumentasi project
├── .prettierrc            ← Formatter configuration
├── package.json          ← Root dependencies
├── package-lock.json     ← Lock file
├── LICENSE               ← Lisensi project
└── README.md             ← Main documentation
```

---

## Root Level Files

### `.prettierrc`

**Apa:** Konfigurasi Prettier (automatic code formatter)

**Gunakan:** Prettier otomatis format code saat save di VS Code

**Jangan diubah:** Kecuali team agree untuk mengubah formatting rules

---

### `package.json`

**Apa:** Root project dependencies dan scripts

**Isi:**

- Monorepo configuration (workspaces)
- Global dependencies (prettier, eslint, dll)
- Root scripts (dev, build, test untuk semua apps)

**Contoh:**

```json
{
  "name": "renjana",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build"
  }
}
```

---

### `package-lock.json`

**Apa:** Lock file untuk npm (versioning lock)

**Jangan edit manual:** Git akan handle ini

---

### `LICENSE`

**Apa:** License project (MIT)

**Jangan ubah:** Kecuali ada requirement legal

---

### `README.md`

**Apa:** Main documentation project

**Isi:**

- Project overview
- Setup instructions
- Tech stack
- Contributing guidelines

**Update:** Kapan ada major changes

---

## Folder `apps/`

Container untuk aplikasi utama (Frontend & Backend).

### `apps/backend/` — NestJS API Server

```txt
backend/
├── src/                    ← Source code
│   ├── config/             ← Konfigurasi (env, database, etc)
│   ├── infrastructure/      ← External services (Redis, Cloudinary, Mail)
│   ├── jobs/               ← Background jobs (BullMQ queues)
│   ├── modules/            ← Feature modules (Users, Auth, Products, etc)
│   ├── shared/             ← Shared utilities (decorators, guards, pipes)
│   ├── app.controller.ts   ← Main controller
│   ├── app.module.ts       ← Main module (di-import semua modules)
│   ├── app.service.ts      ← Main service
│   └── main.ts             ← Entry point (bootstrap NestJS)
│
├── test/                   ← Testing (unit & e2e)
│   ├── app.e2e-spec.ts    ← End-to-end tests
│   └── jest-e2e.json      ← Jest config untuk e2e
│
├── prisma/                 ← Database ORM (ada di root atau di sini)
│   └── schema.prisma      ← Database schema definition
│
├── docker-compose.yml      ← Local dev environment (PostgreSQL, Redis)
├── nest-cli.json          ← NestJS CLI configuration
├── eslint.config.mjs      ← ESLint rules
├── tsconfig.json          ← TypeScript config
├── tsconfig.build.json    ← Build-specific config
├── package.json           ← Backend dependencies
├── README.md              ← Backend documentation
└── .env.example           ← Template environment variables
```

**Tujuan:** API server yang handle semua logic business

**Tech Stack:**

- NestJS (framework)
- PostgreSQL (database)
- Prisma (ORM)
- Redis (cache & queue)
- Winston (logging)
- Jest (testing)

**Dijalankan:** Railway (production) | localhost:3000 (development)

---

### `apps/frontend/` — Next.js Web Client

```txt
frontend/
├── app/                    ← Next.js App Router
│   ├── (auth)/            ← Route group untuk auth pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       ← Route group untuk dashboard pages
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── settings/
│   ├── layout.tsx         ← Root layout (metadata, fonts, providers)
│   ├── page.tsx           ← Home page (welcome animation)
│   ├── globals.css        ← Global styles (Tailwind)
│   └── favicon.ico        ← Browser tab icon
│
├── components/            ← Reusable React components
│   ├── ui/                ← UI components (buttons, cards, inputs)
│   ├── forms/             ← Form components (login form, etc)
│   ├── layout/            ← Layout components (navbar, sidebar, footer)
│   ├── shared/            ← Shared components (loading, error, etc)
│   └── welcome-animation.tsx ← Welcome animation component
│
├── hooks/                 ← Custom React hooks
│   ├── useAuth.ts        ← Hook untuk authentication
│   ├── useTheme.ts       ← Hook untuk theme management
│   └── useApi.ts         ← Hook untuk API calls
│
├── lib/                   ← Utility functions & helpers
│   ├── api.ts            ← API client (fetch wrapper)
│   ├── validations.ts    ← Form validation schemas
│   └── utils.ts          ← Helper functions
│
├── stores/                ← State management (Zustand)
│   ├── authStore.ts      ← Authentication state
│   ├── themeStore.ts     ← Theme state
│   └── userStore.ts      ← User data state
│
├── styles/                ← CSS modules atau additional styles
│   ├── theme.css         ← Theme colors & variables
│   └── animations.css    ← Keyframe animations
│
├── public/                ← Static assets (images, icons)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── next.config.ts        ← Next.js configuration
├── postcss.config.mjs    ← PostCSS config (Tailwind)
├── eslint.config.mjs     ← ESLint rules
├── tsconfig.json         ← TypeScript config
├── package.json          ← Frontend dependencies
├── README.md             ← Frontend documentation
├── AGENTS.md             ← Claude AI agent instructions
├── CLAUDE.md             ← Claude prompt template
└── .env.example          ← Template environment variables
```

**Tujuan:** Web interface yang user-friendly dan responsive

**Tech Stack:**

- Next.js 15+ (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Zustand (state management)
- React Hook Form (form handling)

**Dijalankan:** Vercel (production) | localhost:3000 (development)

**Environment Variables Needed:**

```txt
NEXT_PUBLIC_API_URL=http://localhost:3000  # atau Railway URL production
```

---

## Folder `packages/`

Shared code yang digunakan oleh multiple apps (frontend + backend).

### `packages/types/` — Shared TypeScript Types

```txt
types/
├── src/
│   ├── index.ts          ← Export semua types
│   ├── user.ts           ← User related types
│   ├── auth.ts           ← Authentication types
│   ├── product.ts        ← Product related types
│   └── common.ts         ← API response, error types
│
├── package.json          ← Package definition
├── tsconfig.json         ← TypeScript config
└── README.md             ← Types documentation
```

**Tujuan:** Centralized type definitions yang di-share frontend & backend

**Keuntungan:**

- ✅ Single source of truth untuk types
- ✅ Frontend & Backend always in sync
- ✅ Type-safe API integration
- ✅ Reduce code duplication

**Contoh Penggunaan:**

```typescript
// Backend - input/output types
import { User, CreateUserDto, ApiResponse } from '@renjana/types';

// Frontend - response types
import { User, LoginResponse } from '@renjana/types';
```

**Import di Backend & Frontend:**

```typescript
import { User, AuthError } from '@renjana/types';
```

---

### `packages/utils/` — Shared Utility Functions

```txt
utils/
├── src/
│   ├── index.ts          ← Export semua utils
│   ├── string.ts         ← String manipulation (capitalize, slug, etc)
│   ├── date.ts           ← Date utilities (format, parse, etc)
│   ├── validation.ts     ← Validation helpers (email, password, etc)
│   └── math.ts           ← Math utilities
│
├── package.json
├── tsconfig.json
└── README.md
```

**Tujuan:** Utility functions yang reusable di multiple places

**Contoh:**

```typescript
// validation.ts
export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// date.ts
export const formatDate = (date: Date) => {
  return date.toLocaleDateString('id-ID');
};
```

---

## Folder `docs/`

Dokumentasi lengkap project untuk team.

### `docs/GIT_WORKFLOW.md`

**Apa:** Panduan Git & workflow team

**Isi:**

- Branch strategy
- Commit message format
- PR process
- Deployment procedure

**Update:** Kapan ada perubahan workflow

---

## Key Directories Explained

### `apps/backend/src/config/`

**Apa:** Centralized configuration

**Isi:**

- `env.config.ts` — Environment variables (Joi validation)
- `database.config.ts` — Prisma configuration
- `redis.config.ts` — Redis connection
- `cloudinary.config.ts` — Image upload service

**Prinsip:** Konfigurasi di-load sekali saat app startup

---

### `apps/backend/src/modules/`

**Apa:** Feature modules (divided by feature)

**Struktur Setiap Module:**

```txt
modules/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── strategies/
│       ├── jwt.strategy.ts
│       └── local.strategy.ts
│
└── products/
    ├── products.controller.ts
    ├── products.service.ts
    └── products.module.ts
```

**Prinsip:** Setiap module self-contained dan independent

---

### `apps/backend/src/shared/`

**Apa:** Shared utilities & infrastructure di backend

**Isi:**

- `decorators/` — Custom decorators (e.g., @CurrentUser)
- `guards/` — Auth guards (JWT, Role-based)
- `pipes/` — Validation pipes
- `filters/` — Exception filters
- `interceptors/` — Response formatting, logging

---

### `apps/backend/src/infrastructure/`

**Apa:** External services integration

**Isi:**

- `cache/` — Redis caching service
- `cloudinary/` — Image upload service
- `mail/` — Email sending service
- `database/` — Prisma service

---

### `apps/backend/src/jobs/`

**Apa:** Background jobs (queue processing)

**Isi:**

- BullMQ queue definitions
- Job handlers
- Job scheduling

**Contoh:**

- Image processing queue
- Email sending queue
- Report generation queue

---

### `apps/frontend/app/(auth)/`

**Apa:** Route group untuk authentication pages

**Next.js Route Groups:** Folder dengan `()` tidak mempengaruhi URL

```txt
(auth)/
├── login/page.tsx        → /login
├── register/page.tsx     → /register
└── layout.tsx            ← Shared layout untuk auth pages
```

**Keuntungan:** Organize pages tanpa ubah URL structure

---

### `apps/frontend/components/`

**Apa:** Reusable React components

**Struktur:**

- `ui/` — Pure UI components (Button, Card, Input, Dialog)
- `forms/` — Complex form components
- `layout/` — Layout components (Navbar, Sidebar, Footer)
- `shared/` — Shared components (Loading, Error, Empty State)

**Prinsip:** Components harus reusable dan props-driven

---

### `apps/frontend/hooks/`

**Apa:** Custom React hooks untuk logic reusable

**Contoh:**

```typescript
// useAuth.ts - Authentication logic
export const useAuth = () => {
  const [user, setUser] = useState(null);
  // ... auth logic
  return { user, login, logout };
};

// useApi.ts - API calls
export const useApi = (url) => {
  const [data, setData] = useState(null);
  // ... fetch logic
  return { data, loading, error };
};
```

---

### `apps/frontend/stores/`

**Apa:** Global state management (Zustand)

**Contoh:**

```typescript
// authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  login: (email, password) => {
    /* ... */
  },
  logout: () => {
    /* ... */
  },
}));
```

**Dipakai Di Components:**

```typescript
const { user, login } = useAuthStore();
```

---

### `apps/frontend/lib/`

**Apa:** Helper functions & utilities

**Isi:**

- `api.ts` — Axios/fetch wrapper dengan error handling
- `validations.ts` — Form validation schemas (Zod/Yup)
- `utils.ts` — General helper functions

---

## Data Flow Example

### Authentication Flow

```txt
1. User akses /login
   ↓
2. LoginForm component (apps/frontend/components/forms)
   ↓
3. Form submit → useAuth hook
   ↓
4. API call ke /api/auth/login (api.ts)
   ↓
5. Backend route: /auth/login (auth.controller.ts)
   ↓
6. Auth service: validateCredentials() (auth.service.ts)
   ↓
7. Database query via Prisma (shared infrastructure)
   ↓
8. Return JWT token
   ↓
9. Frontend store token (authStore.ts)
   ↓
10. Redirect ke /dashboard
```

---

## File Naming Convention

| File Type  | Convention                   | Example                               |
| ---------- | ---------------------------- | ------------------------------------- |
| Components | PascalCase                   | `UserCard.tsx`, `LoginForm.tsx`   |
| Hooks      | camelCase dengan`use`      | `useAuth.ts`, `useTheme.ts`       |
| Services   | camelCase dengan`.service.ts | `auth.service.ts`, `user.service.ts |
| Utils      | camelCase                    | `formatDate.ts`, `validateEmail.ts  |
| Types      | PascalCase                   | `User.ts`, `ApiResponse.ts`       |
| Tests      | `.spec.ts` atau `.test.ts  | `user.service.spec.ts`              |

---

## Quick Navigation Guide

### Backend Developer

- Primary folder: `apps/backend/src/modules/`
- Config: `apps/backend/src/config/`
- Infrastructure: `apps/backend/src/infrastructure/`
- Shared types: `packages/types/`

### Frontend Developer

- Primary folder: `apps/frontend/app/` dan `apps/frontend/components/`
- State: `apps/frontend/stores/`
- Hooks: `apps/frontend/hooks/`
- Shared types: `packages/types/`

### Full Stack Developer

- Backend: `apps/backend/`
- Frontend: `apps/frontend/`
- Shared: `packages/`
- Workflow: `docs/GIT_WORKFLOW.md`

---

## Important Notes

### DO

- Organize code by feature (dalam modules folder)
- Keep components small dan reusable
- Use shared types & utils
- Follow naming conventions
- Test critical business logic

### DON'T

- Create nested folders terlalu dalam (max 3-4 levels)
- Mix multiple concerns dalam 1 file
- Hardcode magic strings (use constants)
- Ignore types (use TypeScript properly)
- Skip unit tests untuk business logic

---

## Related Documentations

- **Git Workflow:** `docs/GIT_WORKFLOW.md`
- **Backend README:** `apps/backend/README.md`
- **Frontend README:** `apps/frontend/README.md`
- **Main README:** `README.md`
