import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  FileSearch,
  Menu,
  Send,
  Video,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '#/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { ThemeToggle } from '#/components/marketing/theme-toggle'
import { cn } from '#/lib/utils'

type MenuItem = {
  title: string
  url: string
  description?: string
  icon: ReactNode
}

/** Product features — one dropdown item per real landing anchor. */
const products: MenuItem[] = [
  {
    title: 'Resume Matching',
    description: 'Context-aware candidate matching beyond keywords',
    icon: <FileSearch className="size-5 shrink-0 text-primary" />,
    url: '/#resume-matching',
  },
  {
    title: 'Screening Interviews',
    description: 'Automated AI-driven interviews for quality evaluation',
    icon: <Video className="size-5 shrink-0 text-primary" />,
    url: '/#screening-interview',
  },
  {
    title: 'Smart Outreach',
    description: 'Personalised outreach to every shortlisted candidate',
    icon: <Send className="size-5 shrink-0 text-primary" />,
    url: '/#smart-outreach',
  },
]

const flatLinks = [
  { title: 'Pricing', url: '/pricing' },
  { title: 'Contact Us', url: '/contact' },
] as const

export function MarketingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkClass =
    'inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary'

  return (
    <header
      data-testid="marketing-header"
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-out',
        isScrolled
          ? 'border-b border-border/50 bg-background/85 shadow-sm backdrop-blur-md'
          : 'bg-transparent',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between lg:h-[4.5rem]">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/Talsek_logo_square.png"
              alt="Talsek Logo"
              className="h-9 w-9"
            />
            <span className="font-display text-xl font-bold tracking-tight">
              Talsek
            </span>
          </Link>

          <nav
            role="navigation"
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center md:flex"
          >
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="bg-transparent text-muted-foreground hover:bg-accent hover:text-primary"
                    onClick={(e) => e.preventDefault()}
                  >
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-80 p-3">
                      {products.map((product) => (
                        <li key={product.title}>
                          <NavigationMenuLink asChild>
                            <a
                              className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                              href={product.url}
                            >
                              {product.icon}
                              <div>
                                <div className="text-sm font-semibold">
                                  {product.title}
                                </div>
                                {product.description ? (
                                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                                    {product.description}
                                  </p>
                                ) : null}
                              </div>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {flatLinks.map((link) => (
                  <NavigationMenuItem key={link.title}>
                    <NavigationMenuLink asChild>
                      <a href={link.url} className={linkClass}>
                        {link.title}
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/docs" className={linkClass}>
                      Docs
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="lg"
              className="font-semibold text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button size="lg" className="rounded-xl font-semibold" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link to="/" className="flex items-center gap-2">
                      <img
                        src="/Talsek_logo_square.png"
                        alt="Talsek Logo"
                        className="h-8 w-8"
                      />
                      <span className="font-display text-lg font-bold">
                        Talsek
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    <AccordionItem value="product" className="border-b-0">
                      <AccordionTrigger className="py-0 font-semibold hover:no-underline">
                        Product
                      </AccordionTrigger>
                      <AccordionContent className="mt-2">
                        {products.map((product) => (
                          <a
                            key={product.title}
                            className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                            href={product.url}
                          >
                            {product.icon}
                            <div>
                              <div className="text-sm font-semibold">
                                {product.title}
                              </div>
                              {product.description ? (
                                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                                  {product.description}
                                </p>
                              ) : null}
                            </div>
                          </a>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {[...flatLinks, { title: 'Docs', url: '/docs' }].map(
                    (link) => (
                      <a
                        key={link.title}
                        href={link.url}
                        className="flex items-center justify-between rounded-md p-3 font-semibold transition-colors hover:bg-muted hover:text-accent-foreground"
                      >
                        {link.title === 'Docs' ? (
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {link.title}
                          </span>
                        ) : (
                          link.title
                        )}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ),
                  )}

                  <div className="flex flex-col gap-3">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="justify-start font-semibold text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <Link to="/signin">Sign In</Link>
                    </Button>
                    <Button
                      size="lg"
                      className="rounded-xl font-semibold"
                      asChild
                    >
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {/* Mobile theme toggle sits beside the menu button */}
        <div className="absolute top-1/2 right-16 -translate-y-1/2 md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
