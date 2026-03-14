import { useState } from 'react'
import { api } from '../api'
import { useTranslation } from '../i18n'

interface ExplainButtonProps {
  cardId?: number
  translationData?: { source_text: string; target_text: string; language_pair: string }
}

function SparkleIcon({ size = 16, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{
        animation: spinning ? 'sparkle-spin 1.2s linear infinite' : undefined,
        flexShrink: 0,
      }}
    >
      <path
        d="M8 0C8 4.4 11.6 8 16 8C11.6 8 8 11.6 8 16C8 11.6 4.4 8 0 8C4.4 8 8 4.4 8 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    const boldRegex = /\*\*(.+?)\*\*/g
    let match: RegExpExecArray | null
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }
      parts.push(<strong key={`${i}-${match.index}`}>{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }
    if (parts.length === 0) parts.push(line)

    if (line.trim() === '') return <br key={i} />
    return <div key={i} style={{ marginBottom: '4px' }}>{parts}</div>
  })
}

export default function ExplainButton({ cardId, translationData }: ExplainButtonProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(true)

  const handleClick = async () => {
    if (state === 'loaded') {
      setVisible(!visible)
      return
    }
    if (state === 'loading') return

    setState('loading')
    setError('')
    try {
      let explanationText: string
      if (translationData) {
        const result = await api.explainWord(translationData.source_text, translationData.target_text, translationData.language_pair)
        explanationText = result.explanation
      } else {
        const result = await api.generateExplanation(cardId!)
        explanationText = result.explanation
      }
      setExplanation(explanationText)
      setState('loaded')
      setVisible(true)
    } catch (e: any) {
      setError(e.message || 'Failed to generate explanation')
      setState('error')
    }
  }

  const isIdle = state === 'idle' || state === 'error'
  const isLoading = state === 'loading'
  const isLoadedVisible = state === 'loaded' && visible
  const isLoadedHidden = state === 'loaded' && !visible

  const getButtonLabel = () => {
    if (isLoading) return t('explain.generating')
    if (isLoadedVisible) return t('explain.hide')
    if (isLoadedHidden) return t('explain.show')
    return t('explain.aiExplain')
  }

  const getButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: isLoading ? 'wait' : 'pointer',
      border: 'none',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    }

    if (isIdle || isLoading) {
      return {
        ...base,
        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
        color: '#ffffff',
      }
    }

    if (isLoadedVisible) {
      return {
        ...base,
        background: 'transparent',
        color: '#8B5CF6',
        border: '1.5px solid #8B5CF6',
      }
    }

    // isLoadedHidden — same as idle
    return {
      ...base,
      background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
      color: '#ffffff',
    }
  }

  return (
    <div>
      <style>{`
        @keyframes ai-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sparkle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <button style={getButtonStyle()} onClick={handleClick}>
        {isLoading && (
          <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
            animation: 'ai-shimmer 1.5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
        <SparkleIcon size={16} spinning={isLoading} />
        <span style={{ position: 'relative' }}>{getButtonLabel()}</span>
      </button>

      {state === 'error' && error && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#ff3b3020',
          borderRadius: '8px',
          color: '#ff3b30',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {state === 'loaded' && visible && (
        <div style={{
          marginTop: '10px',
          backgroundColor: 'var(--tg-secondary-bg-color)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#8B5CF6',
            borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          }}>
            <SparkleIcon size={12} />
            {t('explain.aiExplanation')}
          </div>
          <div style={{
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {renderMarkdown(explanation)}
          </div>
        </div>
      )}
    </div>
  )
}
