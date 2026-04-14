# Project-V2.0 Agent Notes

## Repo Shape
- This repo is not a workspace. Treat `nest-admin/` and `nest-admin-frontend/` as separate npm projects with their own `package-lock.json` and scripts.
- Root `package.json` is not an app entrypoint; it only holds a few shared type/JWT deps.

## Backend (`nest-admin`)
- Use `npm run dev` for local backend work. It runs `nest start --debug --watch -- -b swc env=dev`.
- Production boot is `npm run start:prod`, which runs `node dist/src/main env=prod`. The `env=...` CLI arg is required because `config/index.ts` reads `process.argv` to choose config.
- Build with `npm run build`.
- Lint with `npm run lint`. Format with `npm run format`.
- Unit tests are only `*.spec.ts` under `src/` because Jest `rootDir` is `src` and `testRegex` is `.*\.spec\.ts$`.
- E2E tests use `npm run test:e2e` with `test/jest-e2e.json` and `*.e2e-spec.ts`.

## Backend Wiring
- Real backend entrypoint is `nest-admin/src/main.ts`.
- Global API prefix is `/api` via `app.setGlobalPrefix(config.apiBase)`. Frontend requests and manual curl tests should include `/api`.
- Path aliases are registered at runtime in `src/main.ts` via `tsconfig-paths`; imports like `config` resolve to `config/index`.
- `src/common/BaseController.ts` defines the default CRUD route shape used across many modules: `POST /save`, `POST /add`, `PUT /update`, `DELETE /del/:ids`, `GET /list`, `GET /getOne/:id`.
- `src/app.module.ts` is the composition root for system modules (`src/modules`), business modules (`src/modulesBusi`), AI (`src/modulesAi`), scheduled tasks, and workflow listeners.

## Backend Data / Env Gotchas
- Default DB config in `nest-admin/config/index.ts` points to MySQL database `psd2`, not `nest_admin`.
- Both `dev` and `prod` configs set TypeORM `synchronize: true`. Be conservative with entity changes.
- `config/index.ts` contains placeholder JWT secret text, then merges `config/secret.js` or `config/secret.copy.js` if present. Put real secrets there instead of hardcoding them into source.
- Backend expects MySQL and Redis for normal local startup.

## Frontend (`nest-admin-frontend`)
- Use `npm run dev` for local frontend work.
- `npm run test` is not a test runner. It starts Vite in `--mode=test`.
- Build commands are mode-specific: `npm run build`, `npm run build:dev`, `npm run build:test`.
- Type-check with `npm run type-check` (`vue-tsc --build --force`). There is no dedicated lint script in `package.json`.

## Frontend Wiring
- Real frontend entrypoint is `nest-admin-frontend/src/main.ts`.
- Vite dev server port is `1994` in development and `1995` in production mode, from `vite.config.ts`.
- Dev API calls should usually go through Vite proxy: `src/utils/request.js` uses `/api` when `NODE_ENV === 'development'`, and `vite.config.ts` proxies `/api` to `sys.config.js` `BASE_API`.
- `src/utils/request.js` overrides `request.get(url, secondArg)` so the second argument is used directly as query params. Do **not** wrap it as `{ params }`.
- The app decides runtime environment from `window.location.origin` in `sys.config.js`, not just from `NODE_ENV`. Keep domain-based env selection intact when changing config.
- Router uses `createWebHistory`, not hash history.
- Vite auto-imports Vue, Vue Router, Pinia, Element Plus components, and registers SVG icons from `src/assets/icons/svg`.
- Frontend repo contains generated/build outputs (`dist/`, `auto-imports.d.ts`, `components.d.ts`) and leftover `*.sync-conflict-*` files under `src/`. Prefer editing the canonical source files, not generated artifacts or conflict copies.

## API Contract Rules
- Prefer unwrapping transport response layers in `src/api/**` or `views/**/api.ts`; Vue pages should consume stable business data directly.
- Avoid response-shape guessing in pages (`res.data.data`, `res.data?.data?.*`); that logic belongs in API adapters.
- Backend services/controllers should avoid hand-wrapping `{ code, data }` payloads when `GlobalInterceptor` is already wrapping responses.

## Verification Order
- Backend-focused change: run `npm run lint` in `nest-admin`, then the smallest relevant Jest command (`npm test` or `npm run test:e2e` only if needed).
- Frontend-focused change: run `npm run type-check` in `nest-admin-frontend`, then the narrowest useful build command if config/runtime wiring changed.

## Deployment Caution
- `nest-admin/bin/build.sh` does a destructive `git reset --hard HEAD` before `git pull`. Do not run it casually in a working tree.
