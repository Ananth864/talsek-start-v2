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

  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-center"
      data-testid="interview-welcome"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">
          Talsek Interview
        </h1>
        <p className="text-muted-foreground">
          You&apos;ve been invited to interview for the{' '}
          <strong className="text-foreground">{jobTitle}</strong> position at{' '}
          <strong className="text-foreground">{companyName}</strong>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-left">
        <h2 className="mb-3 text-lg font-medium">How this works</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>1. Our AI will ask you questions in text format</li>
          <li>2. You respond by speaking (up to 2 minutes per question)</li>
          <li>3. Your responses are transcribed and reviewed</li>
          <li>4. The process takes about 15 minutes</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center justify-center gap-2 text-base font-medium">
          <Mic className="h-5 w-5" />
          Microphone check
        </h3>
        <div className="flex items-center justify-center gap-3">
          {hasPermission === null ? (
            <span className="text-muted-foreground">
              Checking microphone access…
            </span>
          ) : null}
          {hasPermission === true ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-700">
                Microphone ready
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
                Grant microphone access
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onBegin}
        disabled={isStarting || hasPermission === null}
        data-testid="interview-begin"
      >
        {isStarting
          ? 'Starting interview…'
          : hasPermission === null
            ? 'Checking microphone…'
            : 'Begin interview'}
      </Button>
      {hasPermission === false ? (
        <p className="text-sm text-muted-foreground">
          Microphone unavailable — you can still type answers during the
          interview.
        </p>
      ) : null}
    </div>
  )
}
