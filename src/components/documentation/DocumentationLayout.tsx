import type { HTMLAttributes, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import {
  DocumentationSidebar,
  DocumentationSidebarNav,
} from './DocumentationSidebar'

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
      <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-8 md:py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center justify-between gap-3">
            {title ? (
              <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl md:text-3xl">
                {title}
              </h1>
            ) : null}
          </div>
          {showSearch ? (
            <div className="group relative hidden w-full sm:block md:w-80">
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
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-8 md:py-10">
        <div className="flex gap-8 xl:gap-16">{children}</div>
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
    <article className={cn('min-w-0 flex-1', className)} {...props}>
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
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar: nav lives in a sheet below lg */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-sidebar/80 px-4 py-2.5 backdrop-blur-xl lg:hidden">
          <Link
            to="/docs/$"
            params={{ _splat: 'get-started' }}
            className="flex items-center gap-2"
          >
            <img
              src="/white_circle.png"
              alt="Talsek Logo"
              className="h-7 w-7 dark:hidden"
            />
            <img
              src="/black_circle.png"
              alt="Talsek Logo"
              className="hidden h-7 w-7 dark:block"
            />
            <span className="font-semibold">Talsek</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open documentation menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <SheetHeader className="border-b border-border/40">
                <SheetTitle className="sr-only">
                  Documentation navigation
                </SheetTitle>
              </SheetHeader>
              <DocumentationSidebarNav />
            </SheetContent>
          </Sheet>
        </div>
        <DocumentationHeader title={title} />
        <DocumentationMain>{children}</DocumentationMain>
      </div>
    </div>
  )
}
