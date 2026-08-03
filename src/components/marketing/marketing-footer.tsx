import { Linkedin, Mail, Twitter } from 'lucide-react'

export function MarketingFooter() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-background"
      data-testid="marketing-footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center space-x-3 md:justify-start">
              <img
                src="/Talsek_logo_square.png"
                alt="Talsek Logo"
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-foreground">Talsek</span>
            </div>
            <p className="mx-auto max-w-md text-muted-foreground md:mx-0">
              Transform your hiring process with AI-powered recruitment
              solutions. Find the perfect candidates beyond keyword matching.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <h3 className="mb-8 font-semibold text-foreground">Products</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#resume-matching"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Resume Matching
                </a>
              </li>
              <li>
                <a
                  href="#screening-interview"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Screening Interview
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center text-center">
            <h3 className="mb-8 font-semibold text-foreground">Connect</h3>
            <div className="flex justify-center space-x-4">
              <a
                href="https://x.com/RomitShrvstv"
                aria-label="Twitter"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/talsek"
                aria-label="LinkedIn"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:romitrajeshshrivastava@gmail.com"
                aria-label="Email"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center text-sm text-muted-foreground md:text-left">
              © 2025 Talsek • All rights reserved
            </div>
            <div />
            <div className="flex flex-col items-center space-y-2 text-center">
              <a
                href="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
