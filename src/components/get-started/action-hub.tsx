import { Link } from '@tanstack/react-router'
import {
  CreditCard,
  Plus,
  UserCircle,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ACTION_HUB_LINKS } from '#/lib/onboarding'

const LINK_ICONS = {
  '/dashboard': Plus,
  '/candidates': UserCircle,
  '/users': Users,
  '/billing': CreditCard,
} as const

export function ActionHub() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8"
      data-testid="action-hub"
    >
      <div className="space-y-2 py-4 text-left">
        <h2 className="text-2xl font-bold tracking-tight">Quick Links</h2>
        <p className="text-muted-foreground">
          Access your most used tools and settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {ACTION_HUB_LINKS.map((action) => {
          const Icon = LINK_ICONS[action.route]
          return (
            <Link
              key={action.route}
              to={action.route}
              className="block"
              data-testid={action.testId}
            >
              <Card className="h-full transition-colors hover:border-primary/50 group">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl transition-colors group-hover:text-primary">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="pt-2 text-base">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
