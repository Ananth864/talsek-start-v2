import { Mic, Square } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { AudioRecorder } from '#/hooks/use-audio-recorder'

type AIVoiceInputProps = {
  audioRecorder: AudioRecorder
  className?: string
  disabled?: boolean
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Voice input chrome matching source AIVoiceInput structure (visualizer +
 * circular mic/stop + timer). Uses ported theme tokens inside a dark stage
 * (ADR-0030 §2).
 */
export function AIVoiceInput({
  audioRecorder,
  className,
  disabled = false,
}: AIVoiceInputProps) {
  const { isRecording, duration, startRecording, stopRecording, maxDurationMs } =
    audioRecorder

  const handleClick = () => {
    if (disabled) return
    if (isRecording) stopRecording()
    else startRecording()
  }

  const maxRecordingSeconds = Math.floor(maxDurationMs / 1000)
  const remainingSeconds = Math.max(
    0,
    maxRecordingSeconds - Math.floor(duration / 1000),
  )

  return (
    <div className={cn('w-full py-3 md:py-4', className)}>
      <div className="relative mx-auto flex w-full max-w-4xl items-center justify-center gap-4 md:gap-6">
        <div
          className={cn(
            'flex h-16 max-w-2xl flex-1 items-center justify-center rounded-xl border border-border bg-muted/40 px-4 py-2 transition-all duration-300 md:h-20 md:px-6 md:py-3',
            disabled && 'opacity-50',
          )}
          data-testid="interview-voice-visualizer"
          aria-hidden
        >
          <div className="flex h-full w-full items-end justify-center gap-1 md:gap-1.5">
            {Array.from({ length: 48 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-0.5 rounded-full transition-all duration-300 md:w-1',
                  disabled
                    ? 'h-1 bg-muted-foreground/30 md:h-1.5'
                    : isRecording
                      ? 'h-3 animate-pulse bg-primary md:h-4'
                      : 'h-2 bg-muted-foreground/40 md:h-3',
                )}
                style={
                  isRecording && !disabled
                    ? {
                        height: `${20 + ((index * 17) % 60)}%`,
                        animationDelay: `${(index % 8) * 40}ms`,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            className={cn(
              'group flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card transition-all duration-300 md:h-14 md:w-14',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : isRecording
                  ? 'border-destructive/50 hover:bg-destructive/10 active:scale-95'
                  : 'border-primary/40 hover:bg-primary/10 active:scale-95',
            )}
            onClick={handleClick}
            disabled={disabled}
            data-testid="interview-record"
            aria-label={isRecording ? 'Stop recording' : 'Record answer'}
          >
            {disabled ? (
              <Mic className="h-5 w-5 text-muted-foreground md:h-6 md:w-6" />
            ) : isRecording ? (
              <Square className="h-5 w-5 fill-current text-destructive md:h-6 md:w-6" />
            ) : (
              <Mic className="h-5 w-5 text-primary md:h-6 md:w-6" />
            )}
          </button>

          <div
            className="text-center text-xs text-muted-foreground md:text-sm"
            data-testid="interview-voice-timer"
          >
            {isRecording ? (
              <>
                <div className="font-mono">{formatTime(duration)}</div>
                <div className="text-[10px] md:text-xs">{remainingSeconds}s left</div>
              </>
            ) : (
              <div className="font-mono">{formatTime(0)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
