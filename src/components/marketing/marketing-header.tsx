import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, FileSearch, Menu, Target, Video } from 'lucide-react'
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
import { cn } from '#/lib/utils'

type MenuItem = {
  title: string
  url: string
  description?: string
  icon: ReactNode
}

const products: MenuItem[] = [
  {
    title: 'Resume Matching',
    description: 'AI-powered candidate matching beyond keywords',
    icon: <FileSearch className="size-5 shrink-0 text-primary" />,
    url: '/#resume-matching',
  },
  {
    title: 'Screening Interview',
    description: 'Automated AI-driven interviews for quality evaluation',
    icon: <Video className="size-5 shrink-0 text-primary" />,
    url: '/#screening-interview',
  },
]

const solutions: MenuItem[] = [
  {
    title: 'Best Fit Candidate',
    description: 'Find candidates with perfect skills and culture alignment',
    icon: <Target className="size-5 shrink-0 text-primary" />,
    url: '/#best-fit-candidate',
  },
  {
    title: 'Interview Ready Candidate',
    description: 'Get pre-screened candidates ready for your interview',
    icon: <ArrowRight className="size-5 shrink-0 text-primary" />,
    url: '/#interview-ready-candidate',
  },
]

export function MarketingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      data-testid="marketing-header"
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-out',
        isScrolled
          ? 'border-b border-border/50 bg-background/90 shadow-lg backdrop-blur-sm'
          : 'bg-transparent',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/Talsek_logo_square.png"
              alt="Talsek Logo"
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-foreground">Talsek</span>
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
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => e.preventDefault()}
                  >
                    Products
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
                                  <p className="text-sm leading-snug text-muted-foreground">
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

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => e.preventDefault()}
                  >
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-80 p-3">
                      {solutions.map((solution) => (
                        <li key={solution.title}>
                          <NavigationMenuLink asChild>
                            <a
                              className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                              href={solution.url}
                            >
                              {solution.icon}
                              <div>
                                <div className="text-sm font-semibold">
                                  {solution.title}
                                </div>
                                {solution.description ? (
                                  <p className="text-sm leading-snug text-muted-foreground">
                                    {solution.description}
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

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="/pricing"
                      className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      Pricing
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="/contact"
                      className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      Contact Us
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="lg" className="font-semibold" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button size="lg" className="font-semibold shadow-lg" asChild>
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
                      <span className="text-lg font-semibold">Talsek</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    <AccordionItem value="products" className="border-b-0">
                      <AccordionTrigger className="py-0 font-semibold hover:no-underline">
                        Products
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
                                <p className="text-sm leading-snug text-muted-foreground">
                                  {product.description}
                                </p>
                              ) : null}
                            </div>
                          </a>
                        ))}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="solutions" className="border-b-0">
                      <AccordionTrigger className="py-0 font-semibold hover:no-underline">
                        Solutions
                      </AccordionTrigger>
                      <AccordionContent className="mt-2">
                        {solutions.map((solution) => (
                          <a
                            key={solution.title}
                            className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                            href={solution.url}
                          >
                            {solution.icon}
                            <div>
                              <div className="text-sm font-semibold">
                                {solution.title}
                              </div>
                              {solution.description ? (
                                <p className="text-sm leading-snug text-muted-foreground">
                                  {solution.description}
                                </p>
                              ) : null}
                            </div>
                          </a>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <a
                    href="/pricing"
                    className="flex items-center justify-between rounded-md p-3 font-semibold transition-colors hover:bg-muted hover:text-accent-foreground"
                  >
                    Pricing
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/contact"
                    className="flex items-center justify-between rounded-md p-3 font-semibold transition-colors hover:bg-muted hover:text-accent-foreground"
                  >
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <div className="flex flex-col gap-3">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="justify-start font-semibold"
                      asChild
                    >
                      <Link to="/signin">Sign In</Link>
                    </Button>
                    <Button size="lg" className="font-semibold shadow-lg" asChild>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
