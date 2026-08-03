import { useState, useRef, useCallback } from 'react'

export const MAX_RECORDING_DURATION_MS = 120_000

export type AudioRecorder = {
  isRecording: boolean
  hasPermission: boolean | null
  permissionDenied: boolean
  audioBlob: Blob | null
  duration: number
  requestPermission: () => Promise<boolean>
  startRecording: () => void
  stopRecording: () => void
  cleanup: () => void
  resetAudioBlob: () => void
  maxDurationMs: number
}

export function useAudioRecorder(): AudioRecorder {
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasPermission(true)
      setPermissionDenied(false)
      return true
    } catch {
      setHasPermission(false)
      setPermissionDenied(true)
      return false
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      setIsRecording(false)
      mediaRecorderRef.current = null
    }

    mediaRecorder.start(1000)
    setIsRecording(true)
    setDuration(0)
    setAudioBlob(null)

    durationTimerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1000)
    }, 1000)

    timerRef.current = setTimeout(() => {
      stopRecording()
    }, MAX_RECORDING_DURATION_MS)
  }, [stopRecording])

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
  }, [])

  const resetAudioBlob = useCallback(() => {
    setAudioBlob(null)
  }, [])

  return {
    isRecording,
    hasPermission,
    permissionDenied,
    audioBlob,
    duration,
    requestPermission,
    startRecording,
    stopRecording,
    cleanup,
    resetAudioBlob,
    maxDurationMs: MAX_RECORDING_DURATION_MS,
  }
}
