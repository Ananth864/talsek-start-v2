import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { CheckCircle, Mic, XCircle } from 'lucide-react'
import type { AudioRecorder } from '#/hooks/use-audio-recorder'

type WelcomeStageProps = {
  onBegin: () => void
  audioRecorder: AudioRecorder
  isStarting?: boolean
  jobTitle: string
  companyName: string
}

export function WelcomeStage({
  onBegin,
  audioRecorder,
  isStarting = false,
  jobTitle,
  companyName,
}: WelcomeStageProps) {
  const { hasPermission, requestPermission } = audioRecorder
  const [permissionRequested, setPermissionRequested] = useState(false)

  useEffect(() => {
    if (permissionRequested) return
    setPermissionRequested(true)
    void requestPermission()
  }, [permissionRequested, requestPermission])

  const beginLabel = isStarting
    ? 'Starting Interview...'
    : hasPermission
      ? 'Begin Interview'
      : hasPermission === null
        ? 'Checking microphone…'
        : 'Microphone Required'

  return (
    <div
      className="mx-auto max-w-2xl space-y-8 px-6 py-12 text-center"
      data-testid="interview-welcome"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Talsek Interview</h1>
        <p className="text-lg text-muted-foreground">
          You&apos;ve been invited to interview for the{' '}
          <strong className="text-foreground">{jobTitle}</strong> position at{' '}
          <strong className="text-foreground">{companyName}</strong>
        </p>
      </div>

      <div
        className="rounded-lg border border-border bg-card p-6 text-left shadow-sm"
        data-testid="interview-how-this-works"
      >
        <h2 className="mb-4 text-xl font-semibold">How this works:</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">1.</span>
            Our AI will ask you questions in text format
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">2.</span>
            You respond by speaking your answer (up to 2 minutes per question)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">3.</span>
            Your responses will be transcribed and reviewed
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">4.</span>
            The entire process takes about 15 minutes
          </li>
        </ul>
      </div>

      <div
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
        data-testid="interview-mic-check"
      >
        <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
          <Mic className="h-5 w-5" />
          Microphone Check
        </h3>
        <div className="flex items-center justify-center gap-3">
          {hasPermission === null ? (
            <span className="text-muted-foreground">
              Checking microphone access...
            </span>
          ) : null}
          {hasPermission === true ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-700">
                Microphone ready!
              </span>
            </>
          ) : null}
          {hasPermission === false ? (
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <XCircle className="h-6 w-6" />
                <span className="font-medium">Microphone access needed</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void requestPermission()}
              >
                Grant Microphone Access
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="px-8 py-3 text-lg"
        onClick={onBegin}
        disabled={!hasPermission || isStarting}
        data-testid="interview-begin"
      >
        {beginLabel}
      </Button>
    </div>
  )
}
