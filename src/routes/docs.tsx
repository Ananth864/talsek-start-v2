import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Public documentation shell. Individual pages render their own sidebar + TOC
 * chrome via DocumentationPage (parity with source DynamicDocPage).
 */
export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return <Outlet />
}
