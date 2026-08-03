import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { CandidateApplyForm } from '#/components/forms/candidate-apply-form'
import { getFormByToken } from '#/server/fn/forms'

const applyFormQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['apply-form', token],
    queryFn: () => getFormByToken({ data: { token } }),
    retry: false,
  })

export const Route = createFileRoute('/apply/$token')({
  // Prefetch + dehydrate the Form Config for SSR first paint (ADR-0007).
  // Invalid/expired tokens leave the query in error state for the component.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        applyFormQueryOptions(params.token),
      )
    } catch {
      // Surface via useQuery error UI — do not fail the whole route shell.
    }
  },
  component: ApplyPage,
})

function ApplyPage() {
  const { token } = Route.useParams()
  const [descriptionOpen, setDescriptionOpen] = useState(false)

  const formQuery = useQuery(applyFormQueryOptions(token))

  const sanitizedJobDescription = useMemo(() => {
    if (!formQuery.data?.jobDescriptionRaw) return ''
    return DOMPurify.sanitize(formQuery.data.jobDescriptionRaw, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
        'code',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  }, [formQuery.data?.jobDescriptionRaw])

  if (formQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardContent className="p-6">Loading form…</CardContent>
        </Card>
      </div>
    )
  }

  const errorMessage =
    formQuery.error instanceof Error ? formQuery.error.message : null
  const isInvalid =
    !!errorMessage &&
    /form not found|expired|disabled/i.test(errorMessage)

  if (isInvalid && !formQuery.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-6" data-testid="apply-invalid">
            Invalid or expired apply link.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (formQuery.error && !formQuery.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-6" data-testid="apply-load-error">
            {errorMessage || 'Failed to load form'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = formQuery.data!
  const expired = !!(data.expiresAt && new Date(data.expiresAt) < new Date())

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6" data-testid="apply-page">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{data.companyName}</h1>
          {expired ? (
            <Badge variant="destructive" className="text-xs">
              Expired
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Open
            </Badge>
          )}
        </div>
        <h2 className="text-lg text-muted-foreground">{data.jobTitle}</h2>
      </div>

      {expired ? (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-4">
            This form link has expired and is no longer accepting applications.
          </CardContent>
        </Card>
      ) : null}

      {data.jobDescriptionRaw ? (
        <div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-left transition-colors hover:bg-muted"
            data-testid="apply-job-description-toggle"
            aria-expanded={descriptionOpen}
            onClick={() => setDescriptionOpen((open) => !open)}
          >
            {descriptionOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-foreground">Job Description</span>
            <span className="ml-auto text-sm text-muted-foreground">
              {descriptionOpen ? 'Click to collapse' : 'Click to expand'}
            </span>
          </button>
          {descriptionOpen ? (
            <Card className="mt-2" data-testid="apply-job-description">
              <CardContent className="p-4">
                <div
                  className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizedJobDescription }}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {!data.questions.length ? (
        <Card>
          <CardContent className="p-6">
            No form configured for this job.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <CandidateApplyForm
              questions={data.questions}
              isExpired={expired}
              token={token}
              customQuestionText={data.customQuestionText}
            />
          </CardContent>
        </Card>
      )}

      <div
        className="flex items-center justify-center gap-2 pt-2"
        data-testid="apply-footer-branding"
      >
        <p className="text-xs text-muted-foreground">Made with</p>
        <img
          src="/Talsek_logo_square.png"
          alt="Talsek Logo"
          className="h-3 w-3"
        />
        <p className="text-xs text-muted-foreground">Talsek</p>
      </div>
    </div>
  )
}
