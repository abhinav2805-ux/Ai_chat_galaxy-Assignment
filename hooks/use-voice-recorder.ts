import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isSupported: boolean
  transcript: string
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetTranscript: () => void
  error: string | null
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    try {
      setError(null)
      setIsRecording(true)
      setTranscript('')

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('Voice recording started')
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        console.log('Voice recording ended')
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()

    } catch (err) {
      console.error('Failed to start voice recording:', err)
      setError('Failed to start voice recording')
      setIsRecording(false)
    }
  }, [isSupported])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isRecording,
    isSupported,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    error
  }
} 