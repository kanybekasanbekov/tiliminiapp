import { useState, useRef, useCallback } from 'react'
import WebApp from '@twa-dev/sdk'

const API_BASE = import.meta.env.VITE_API_URL || ''

const TTS_CACHE_MAX = 200
const ttsCache = new Map<string, Blob>()

function ttsCacheSet(key: string, blob: Blob) {
  if (ttsCache.size >= TTS_CACHE_MAX) {
    // Evict oldest entry (first key in insertion order)
    const oldest = ttsCache.keys().next().value
    if (oldest !== undefined) ttsCache.delete(oldest)
  }
  ttsCache.set(key, blob)
}

interface SpeakerButtonProps {
  text: string
  lang: string
  size?: 'small' | 'medium'
}

function SpeakerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

export default function SpeakerButton({ text, lang, size = 'medium' }: SpeakerButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleClick = useCallback(() => {
    if (state === 'loading') return

    // If already playing, stop it
    if (state === 'playing' && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState('idle')
      return
    }

    WebApp.HapticFeedback.impactOccurred('light')

    const playBlob = (blob: Blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      audioRef.current = audio

      audio.onended = () => {
        setState('idle')
        URL.revokeObjectURL(blobUrl)
      }
      audio.onerror = () => {
        setState('error')
        URL.revokeObjectURL(blobUrl)
      }

      return audio.play()
    }

    const cacheKey = `${text}|${lang}`

    if (ttsCache.has(cacheKey)) {
      playBlob(ttsCache.get(cacheKey)!)
        .then(() => {
          setState('playing')
        })
        .catch(() => {
          setState('error')
          setTimeout(() => setState('idle'), 2000)
        })
      return
    }

    // Build the TTS URL with auth
    const initData = WebApp.initData
    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`

    setState('loading')

    // Fetch audio with auth header, then play from blob URL
    fetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': `tma ${initData}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        ttsCacheSet(cacheKey, blob)
        return playBlob(blob)
      })
      .then(() => {
        setState('playing')
      })
      .catch(() => {
        setState('error')
        // Auto-recover from error state after 2s
        setTimeout(() => setState('idle'), 2000)
      })
  }, [text, lang, state])

  const isSmall = size === 'small'
  const btnSize = isSmall ? '32px' : '38px'
  const iconSize = isSmall ? 15 : 18

  return (
    <button
      onClick={handleClick}
      aria-label="Play pronunciation"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: btnSize,
        height: btnSize,
        borderRadius: '50%',
        border: 'none',
        cursor: state === 'loading' ? 'wait' : 'pointer',
        background: state === 'playing'
          ? 'var(--tg-button-color)'
          : state === 'error'
            ? '#ff3b3020'
            : 'rgba(0, 122, 255, 0.1)',
        color: state === 'playing'
          ? 'var(--tg-button-text-color)'
          : state === 'error'
            ? '#ff3b30'
            : 'var(--tg-button-color)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        opacity: state === 'loading' ? 0.6 : 1,
        animation: state === 'loading' ? 'speaker-pulse 1s ease-in-out infinite' : undefined,
        padding: 0,
      }}
    >
      <style>{`
        @keyframes speaker-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <SpeakerIcon size={iconSize} />
    </button>
  )
}
