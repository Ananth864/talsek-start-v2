import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '#/components/ui/button'

/**
 * Light/dark toggle for marketing pages. Writes the same localStorage key
 * ('theme': light/dark/auto) that the pre-paint boot script in __root reads,
 * so the choice survives reloads.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(next)
    root.style.colorScheme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode etc. — theme just won't persist.
    }
    setIsDark(!isDark)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
