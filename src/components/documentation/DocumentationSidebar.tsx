import { Link, useRouterState } from '@tanstack/react-router'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { ScrollArea } from '#/components/ui/scroll-area'
import { cn } from '#/lib/utils'
import { docStructure } from './docStructure'
import type { DocPage } from './docStructure'

function docsSplat(path: string): string {
  return path.startsWith('/docs/') ? path.slice('/docs/'.length) : path
}

export function DocumentationSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (path: string) => pathname === path

  const isChildActive = (page: DocPage) => {
    if (page.children) {
      return page.children.some((child) => isActive(child.path))
    }
    return isActive(page.path)
  }

  return (
    <aside
      className="sticky top-0 z-30 flex h-screen w-72 flex-col border-r border-border/40 transition-all duration-300"
      data-testid="docs-sidebar"
    >
      <div className="px-4 py-4">
        <Link
          to="/docs/$"
          params={{ _splat: 'get-started' }}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <img
            src="/white_circle.png"
            alt="Talsek Logo"
            className="h-9 w-9 shrink-0 dark:hidden"
          />
          <img
            src="/black_circle.png"
            alt="Talsek Logo"
            className="hidden h-9 w-9 shrink-0 dark:block"
          />
          <span className="text-lg leading-tight font-semibold">Talsek</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-3 py-6">
          <Accordion
            type="multiple"
            defaultValue={['get-started', 'dashboard', 'billing']}
            className="space-y-4"
          >
            {docStructure.map((section) => (
              <AccordionItem
                key={section.title}
                value={section.title.toLowerCase().replace(/\s+/g, '-')}
                className="border-none"
              >
                <AccordionTrigger
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase transition-all hover:text-foreground hover:no-underline',
                    'data-[state=open]:text-foreground',
                  )}
                >
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <ul className="mt-1 space-y-0.5">
                    {section.pages?.map((page) => (
                      <li key={page.path}>
                        {page.children ? (
                          <Accordion
                            type="single"
                            collapsible
                            className="border-none"
                            defaultValue={
                              isChildActive(page) ? page.path : undefined
                            }
                          >
                            <AccordionItem
                              value={page.path}
                              className="border-none"
                            >
                              <AccordionTrigger
                                className={cn(
                                  'rounded-md px-3 py-2 text-[0.925rem] no-underline transition-all hover:bg-muted/50',
                                  isChildActive(page)
                                    ? 'font-medium text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                                )}
                              >
                                {page.title}
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-0 pl-3">
                                <ul className="mt-1 space-y-0.5">
                                  {page.children.map((child) => (
                                    <li key={child.path}>
                                      <Link
                                        to="/docs/$"
                                        params={{
                                          _splat: docsSplat(child.path),
                                        }}
                                        data-testid={`docs-nav-${docsSplat(child.path).replace(/\//g, '-')}`}
                                        className={cn(
                                          'group relative block rounded-md px-3 py-2 text-sm transition-all duration-200',
                                          isActive(child.path)
                                            ? 'bg-primary/5 font-medium text-primary'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                        )}
                                      >
                                        {isActive(child.path) ? (
                                          <div className="absolute top-1/2 left-0 h-3/5 w-1 -translate-y-1/2 rounded-r-md bg-primary" />
                                        ) : null}
                                        <span
                                          className={cn(
                                            'relative z-10',
                                            isActive(child.path) &&
                                              'pl-1.5 transition-all',
                                          )}
                                        >
                                          {child.title}
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ) : (
                          <Link
                            to="/docs/$"
                            params={{ _splat: docsSplat(page.path) }}
                            data-testid={`docs-nav-${docsSplat(page.path).replace(/\//g, '-')}`}
                            className={cn(
                              'group relative block rounded-md px-3 py-2 text-[0.925rem] transition-all duration-200',
                              isActive(page.path)
                                ? 'bg-primary/5 font-medium text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            )}
                          >
                            {isActive(page.path) ? (
                              <div className="absolute top-1/2 left-0 h-3/5 w-1 -translate-y-1/2 rounded-r-md bg-primary" />
                            ) : null}
                            <span
                              className={cn(
                                'relative z-10',
                                isActive(page.path) && 'pl-1.5 transition-all',
                              )}
                            >
                              {page.title}
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      </ScrollArea>
    </aside>
  )
}
