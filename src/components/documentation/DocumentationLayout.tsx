import type { HTMLAttributes, ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import { DocumentationSidebar } from './DocumentationSidebar'

type DocumentationLayoutProps = HTMLAttributes<HTMLDivElement>

export function DocumentationLayout({
  className,
  children,
  ...props
}: DocumentationLayoutProps) {
  return (
    <div
      className={cn('min-h-screen bg-background text-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}

type DocumentationHeaderProps = {
  title?: string
  showSearch?: boolean
}

export function DocumentationHeader({
  title,
  showSearch = true,
}: DocumentationHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/60">
      <div className="container mx-auto max-w-7xl px-8 py-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? (
              <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                {title}
              </h1>
            ) : null}
          </div>
          {showSearch ? (
            <div className="group relative w-full md:w-80">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="text"
                placeholder="Search documentation..."
                className="h-10 rounded-full border-muted-foreground/10 bg-muted/30 pl-10 transition-all hover:border-muted-foreground/20 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                disabled
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

type DocumentationMainProps = HTMLAttributes<HTMLElement>

export function DocumentationMain({
  className,
  children,
  ...props
}: DocumentationMainProps) {
  return (
    <main className={cn('flex-1', className)} {...props}>
      <div className="container mx-auto max-w-7xl px-8 py-10">
        <div className="flex gap-12 xl:gap-16">{children}</div>
      </div>
    </main>
  )
}

type DocumentationContentProps = HTMLAttributes<HTMLElement>

export function DocumentationContent({
  className,
  children,
  ...props
}: DocumentationContentProps) {
  return (
    <article
      className={cn(
        'prose prose-slate max-w-none min-w-0 max-w-4xl flex-1 dark:prose-invert',
        className,
      )}
      {...props}
    >
      {children}
    </article>
  )
}

type DocumentationWrapperProps = {
  children: ReactNode
  title?: string
}

export function DocumentationWrapper({
  children,
  title,
}: DocumentationWrapperProps) {
  return (
    <div
      className="flex min-h-screen bg-background text-foreground"
      data-testid="docs-layout"
    >
      <DocumentationSidebar />
      <div className="flex flex-1 flex-col">
        <DocumentationHeader title={title} />
        <DocumentationMain>{children}</DocumentationMain>
      </div>
    </div>
  )
}
