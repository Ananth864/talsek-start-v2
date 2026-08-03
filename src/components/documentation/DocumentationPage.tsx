import type { ReactNode } from 'react'
import {
  DocumentationContent,
  DocumentationWrapper,
} from './DocumentationLayout'
import { DocumentationTOC } from './DocumentationTOC'

type Section = {
  id: string
  title: string
  level?: number
}

type DocumentationPageProps = {
  title?: string
  sections?: Section[]
  children?: ReactNode
}

export function DocumentationPage({
  title,
  sections,
  children,
}: DocumentationPageProps) {
  return (
    <DocumentationWrapper title={title}>
      <DocumentationContent>
        <div className="flex gap-12 xl:gap-20">
          <div className="min-w-0 max-w-3xl flex-1">
            <div className="rounded-xl border border-border/40 bg-card/30 p-8 shadow-sm">
              <div
                className="prose prose-slate prose-docs dark:prose-invert"
                data-testid="docs-content"
              >
                {children}
              </div>
            </div>
          </div>
          {sections ? <DocumentationTOC sections={sections} /> : null}
        </div>
      </DocumentationContent>
    </DocumentationWrapper>
  )
}
