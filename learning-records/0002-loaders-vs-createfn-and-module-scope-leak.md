# Corrected: loaders vs create*Fn, and the module-scope env leak

Status: active

Three confusions surfaced after Lesson 0001's quiz (which itself scored fine — so the model landed, but the edges needed sharpening):

1. **Loader vs `create*Fn` conflated.** The user treated route loaders and `createServerFn`/`createServerOnlyFn` as rival ways to fetch. Corrected: they are **different categories**. A loader is a *route lifecycle hook* (isomorphic — runs on server during SSR and client during navigation). `createServerFn` is an *execution-boundary marker* (server only, callable from anywhere). They compose: the loader calls the server function. Anchored to their React Router knowledge ("loaders — you already know these; the only new part is they're isomorphic in Start").

2. **`(fn)` vs no-arg signature.** Why `createServerOnlyFn(fn)` takes a function but `createServerFn()` doesn't. Corrected: the "Only" variants are **simple wrappers** (pin one fn to one side, crash on the other — nothing to configure, so you hand it the fn); `createServerFn()`/`createIsomorphicFn()` are **builders** you chain (validator/middleware/handler). Mnemonic: **"Only" = wrapper (takes fn); else = builder.**

3. **Module-scope `process.env` leak — the deepest one.** The user reasoned "isn't `process.env.SECRET` a server feature, so it's Server?" — and asked why moving it inside a loader/function fixes it. Two corrections: (a) `process.env` is indeed a Node API, but the *line of code referencing it* lives in an isomorphic module, so that module ships to the client bundle; the bundler then either inlines the secret as a literal string (leak) or the browser throws `process is not defined`. (b) **Moving it inside a loader does NOT fix it** — loaders are isomorphic. Only moving it into a **server-marked** function (`createServerFn().handler()` / `createServerOnlyFn`) fixes it, because import protection strips that code from the client bundle entirely and the read happens at call time on the server.

Implications: the loader-isomorphic + import-protection distinction is the load-bearing concept for the verification-fluency mission — it's what lets the user spot "AI put a DB call in a loader" and "AI read a secret at module scope." Reinforce this in Lesson 0003 (server functions in depth) and 0004 (loaders/beforeLoad). The reference doc was patched with the loader-vs-createFn table and the precise leak mechanism; re-point the user there on review.
