# TanStack server functions primary; drop tRPC

App-internal RPC uses TanStack Start `createServerFn` server functions (grouped
by domain under `src/server/fn/`). Plain API routes are reserved for plain HTTP:
SSE/streaming and third-party webhooks. We do not use tRPC.

## Considered options

- **Server functions primary + API routes for streams/webhooks (chosen).**
  TanStack-idiomatic; zero boilerplate; `.validator()` + inferred return type
  give full end-to-end type safety with no codegen; composes natively with
  `authMiddleware`; plugs straight into route `loader`/`beforeLoad` for SSR.
- **tRPC primary.** Rejected — would force bridging the cookie-based
  `authMiddleware` into a tRPC `createContext`, duplicating the auth seam for no
  type-safety gain (server functions are already fully typed end-to-end).
- **Keep both.** Rejected — two RPC stacks adds boilerplate with no benefit.

## Consequences

- One RPC concept to learn. Route loaders call server functions directly.
- tRPC scaffold (`src/integrations/trpc/`, `src/routes/api.trpc.$.tsx`) is
  deleted.
- `superjson` retained for richer serialization (Date/Map/Set) across the
  server-fn boundary.
