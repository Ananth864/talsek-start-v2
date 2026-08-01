# TanStack server functions primary; drop tRPC

All app-internal edge functions port to TanStack Start `createServerFn` server
functions (grouped by domain under `src/server/fn/`). Plain API routes are used
only where plain HTTP is required: SSE/streaming and third-party webhooks. tRPC
is removed even though the TanStack installer scaffolded it.

## Considered options

- **Server functions primary + API routes for streams/webhooks (chosen).**
  TanStack-idiomatic; zero boilerplate; `.validator()` + inferred return type
  give full end-to-end type safety with no codegen; composes natively with
  `authMiddleware`; plugs straight into route `loader`/`beforeLoad` for SSR.
- **tRPC primary.** Rejected — would force bridging the cookie-based
  `authMiddleware` into a tRPC `createContext`, duplicating the auth seam for no
  type-safety gain (server functions are already fully typed end-to-end).
- **Keep both.** Rejected — two RPC stacks is exactly the "framework garbage"
  the port is meant to remove.

## Consequences

- One RPC concept to learn. Route loaders call server functions directly.
- tRPC scaffold (`src/integrations/trpc/`, `src/routes/api.trpc.$.tsx`) is
  deleted.
- `superjson` retained for richer serialization (Date/Map/Set) across the
  server-fn boundary.
