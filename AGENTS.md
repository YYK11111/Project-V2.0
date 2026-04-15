# Project-V2.0 Agent Notes

## Repo Boundaries
- This repo is not a workspace. `nest-admin/` and `nest-admin-frontend/` are separate npm projects with separate lockfiles and scripts.
- Root `package.json` is not an app entrypoint; it only provides a shared check script: `npm run check:api-contract`.

## Backend (`nest-admin`)
- Use `npm run dev` for local backend work. It runs `nest start --debug --watch -- -b swc env=dev`.
- `env=...` is required on backend start commands. `config/index.ts` reads `process.argv` to choose config; `npm run start:prod` works because it runs `node dist/src/main env=prod`.
- Real entrypoint is `src/main.ts`. It registers `tsconfig-paths`, enables CORS, applies global prefix `/api`, and wraps responses with `GlobalInterceptor`.
- `src/app.module.ts` is the composition root for system modules (`src/modules`), business modules (`src/modulesBusi`), AI (`src/modulesAi`), scheduled tasks, and workflow listeners.
- `src/common/BaseController.ts` defines the common CRUD routes many modules inherit: `POST /save`, `POST /add`, `PUT /update`, `DELETE /del/:ids`, `GET /list`, `GET /getOne/:id`.
- Jest unit tests only pick up `src/**/*.spec.ts` because `rootDir` is `src` and `testRegex` is `.*\.spec\.ts$`. E2E tests are separate under `test/*.e2e-spec.ts` via `npm run test:e2e`.
- Default DB config points to MySQL database `psd2`, and both `dev` and `prod` have TypeORM `synchronize: true`; be conservative with entity changes.
- `config/index.ts` merges `config/secret.js` or `config/secret.copy.js` if present. Do not hardcode real secrets into source.

## Frontend (`nest-admin-frontend`)
- Use `npm run dev` for local frontend work. Vite serves on `1994` in development and `1995` in production mode.
- `npm run test` is not a test runner; it starts Vite with `--mode=test`.
- Real entrypoint is `src/main.ts`, not the older `main.js` mentioned in upstream docs.
- `sys.config.js` decides runtime environment from `window.location.origin` after build; do not simplify this to `NODE_ENV` only.
- `src/utils/request.js` uses `/api` in local development and relies on the Vite proxy in `vite.config.ts`. Manual local API calls should usually include `/api`.
- `request.get(url, secondArg)` is overridden so the second argument is used directly as query params. Do not call it as `request.get(url, { params })`.
- Vite auto-imports Vue, Vue Router, Pinia, and Element Plus helpers/components, and registers SVG icons from `src/assets/icons/svg`.

## API Contract Guardrails
- Keep response-shape unwrapping in `src/api/**` or `views/**/api.ts`; pages should not depend on `res.data.data` or similar nested transport access.
- Backend controllers/services should return business data directly when possible; do not hand-wrap `{ code, data }` because `GlobalInterceptor` already wraps responses.
- Use the root check after API-shape changes: `npm run check:api-contract`.

## Verification Order
- Backend change: run `npm run lint` in `nest-admin`, then the narrowest relevant Jest command.
- Frontend change: run `npm run type-check` in `nest-admin-frontend`, then the smallest useful build command only if config/build wiring changed.
- Cross-stack API change: run the relevant backend/frontend verification plus root `npm run check:api-contract`.

## Dangerous Script
- Do not casually run `nest-admin/bin/build.sh`; it does `git reset --hard HEAD` before `git pull`.
