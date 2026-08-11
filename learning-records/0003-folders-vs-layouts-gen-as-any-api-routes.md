# Routing follow-ups: folders vs layout routes; gen-file `as any`; API/splat routes

Status: active

Four confusions after Lesson 0002 (quiz again scored fine — the convention table landed; the edges needed sharpening):

1. **&ldquo;Folders share logic&rdquo; — corrected.** The user inferred a plain folder groups pages under shared logic. Actually a plain folder only structures the URL (adds a segment) and organises files — no shared wrapper. Sharing layout/logic requires a **layout route file**: pathed (`posts.tsx` or `posts/route.tsx`, adds the URL too) or pathless (`_authed.tsx`, no URL). Confirmed against the Routing Concepts doc, which also introduces two more folder kinds: **route groups** `(app)/` (pure organisation — no URL, no layout) and **excluded files** `-foo.tsx` (ignored by codegen; for colocating non-route modules). So the four kinds: plain folder (URL only), layout route (URL + logic), pathless layout (logic only), group dir (neither).

2. **`as any` in routeTree.gen.ts is normal.** The generated file carries `// @ts-nocheck` at the top and `as any` on the `.update()` wiring because the recursive route-tree generics are too complex for codegen to emit cleanly. The real type-safety lives elsewhere: each `createFileRoute('/...')` path string (gives TS the file identity) and the `declare module Register { router }` in router.tsx. Practical rule: never import types from the gen file; trust `createFileRoute` + the Register. The `as any` there is NOT permission to use `as any` in user code.

3. **getParentRoute** wires the parent-child edge so rendering (`<Outlet>`), loader data, `beforeLoad` context, search-param schemas, and accumulated types all flow down the tree. It's a thunk `() => Parent` to defer resolution past circular init. It is codegen-generated from file structure — users rarely write it; parentage is expressed by where the file lives.

4. **API routes & splat.** `api.chat.ts` and `api.trpc.$.tsx` are **server endpoints, not pages** — declared with `server.handlers` instead of `component`. `api.trpc.$.tsx` → `/api/trpc/$`: the `$` splat catches every tRPC procedure path (`/api/trpc/inventory.list`, etc.) so one file mounts the whole tRPC router. (Splat captures into `params._splat`.)

Implications: the four-folder taxonomy and &ldquo;API route &ne; page route&rdquo; are load-bearing for verification fluency (catching &ldquo;AI made a separate file per tRPC procedure&rdquo; or &ldquo;AI expects a plain folder to share a layout&rdquo;). Routing reference patched with the folder taxonomy + gen-file note; glossary extended. Reinforce API routes in Lesson 0005.
