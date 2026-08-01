# Hybrid data-fetching: route loaders for SSR + React Query for mutations/Realtime

Initial page data is fetched in TanStack Router route `loader`s that call
user-scoped server functions, with `@tanstack/react-router-ssr-query`
prefetching and dehydrating the Query Cache for SSR. After hydration, React
Query owns mutations, optimistic updates, and Realtime-driven refetches. Server
functions are the `queryFn`; the client never talks to Postgres directly except
via Realtime subscriptions and Storage uploads.

## Considered options

- **Hybrid (chosen).** Gives full SSR (instant dashboard/candidates/billing on
  first paint, no client waterfall) while preserving the existing
  Realtime→React Query invalidation bridge, which keys only on query-key arrays
  and is therefore agnostic to where the data originated.
- **Client React Query only.** Rejected — leaves the SPA waterfall in place,
  which is precisely what the move to TanStack Start is meant to fix.
- **Loaders only (no client cache).** Rejected — Realtime invalidation has
  nothing to invalidate; would reinvent client caching.

## Consequences

- The ~44 read hooks split into loader-driven initial data vs. client queries;
  **query keys stay identical**, so `useJobApplicationsSubscription` ports
  verbatim.
- Because reads go through user-scoped server functions (ADR-4), the redundant
  manual `.eq('company_id', …)` filtering scattered across `useJobs`,
  `useCandidates`, etc. is deleted — RLS owns company scoping.
- The new repo's tRPC-wired `root-provider.tsx` is rewritten to the plain
  QueryClient + `router-ssr-query` dehydration setup (tRPC removed per ADR-2).
