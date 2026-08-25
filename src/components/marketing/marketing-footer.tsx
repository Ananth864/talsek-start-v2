import { Linkedin, Mail, Twitter } from 'lucide-react'

export function MarketingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      data-testid="marketing-footer"
      className="border-t border-border bg-card/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Logo and description */}
          <div className="space-y-4">
            <a href="/" className="flex items-center gap-2.5">
              <img
                src="/Talsek_logo_square.png"
                alt="Talsek Logo"
                className="h-9 w-9"
              />
              <span className="font-display text-xl font-bold tracking-tight">
                Talsek
              </span>
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              The AI hiring engine for startups. Screen every resume, interview
              the best, and hire in days — not months.
            </p>
            <div className="flex space-x-4 pt-1">
              <a
                href="https://x.com/RomitShrvstv"
                aria-label="Twitter"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/talsek"
                aria-label="LinkedIn"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="/contact"
                aria-label="Email"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <nav aria-label="Product">
            <h3 className="label-mono mb-4 text-muted-foreground">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/#how-it-works"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="/#resume-matching"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Resume Matching
                </a>
              </li>
              <li>
                <a
                  href="/#screening-interview"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Screening Interview
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="/docs"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Docs
                </a>
              </li>
            </ul>
          </nav>

          {/* Company links */}
          <nav aria-label="Company">
            <h3 className="label-mono mb-4 text-muted-foreground">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-border/70 pt-6">
          <p className="text-sm text-muted-foreground">
            © {year} Talsek · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
