import { useEffect, useMemo, useState } from 'react'
import { cn } from '#/lib/utils'

type Section = {
  id: string
  title: string
  level?: number
}

type DocumentationTOCProps = {
  sections: Section[]
}

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

export function DocumentationTOC({ sections }: DocumentationTOCProps) {
  const [activeId, setActiveId] = useState('')

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -80% 0px' },
    )

    for (const id of sectionIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [sectionIds])

  return (
    <aside className="sticky top-32 hidden w-64 self-start lg:block xl:w-72">
      <nav className="space-y-4 border-l-2 border-primary/20 pl-6">
        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          On this page
        </h4>
        <ul className="space-y-3">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'w-full text-left text-sm transition-all duration-200 line-clamp-1',
                  'hover:text-foreground',
                  activeId === section.id
                    ? 'translate-x-1 font-medium text-primary'
                    : 'font-normal text-muted-foreground',
                  section.level === 2 && 'pl-4 text-xs',
                )}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
