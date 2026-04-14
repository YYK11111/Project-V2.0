# Frontend API Contract

## Request Rules

- Use `request.get(url, query)` for GET requests in `nest-admin-frontend`.
- Do not pass wrapped params like `request.get(url, { params })`.
- The custom request wrapper in `src/utils/request.js` treats the second argument as query params directly.

## Response Handling Rules

- Unwrap response transport layers in API adapter files (`src/api/**` or `src/views/**/api.ts`).
- Vue pages should consume stable business data only.
- Do not parse transport wrappers in pages (for example: `res.data.data` or `res.data?.data?.list`).

## Layer Responsibilities

- `src/api/**`: send request, normalize/unwrap transport shape, return stable business data.
- `src/views/**/api.ts`: page-level shaping for reusable components (`RequestChartTable` expects `{ data, total }`).
- `.vue` pages: render and interaction only, no transport-shape guessing.

## Standard Shapes

- Detail APIs should return a plain object.
- Page/list APIs should return `{ list, total }` in API layer, and optional `{ data, total }` in page adapter.
- Tree APIs should return plain tree nodes (or explicit `{ menus, checkedKeys }` where needed).

## Forbidden Patterns

```ts
request.get(url, { params })
res.data.data
res.data?.data?.list
```

## Backend Coordination

- Backend already uses `GlobalInterceptor` to wrap responses.
- Avoid manual `{ code, data }` wrapping in service/controller where not required.
- If a module still returns legacy nested shapes, absorb the difference in API adapters, not in pages.
