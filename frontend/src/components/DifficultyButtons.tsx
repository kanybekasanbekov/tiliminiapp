import type { Difficulty } from '../types'
import { useTranslation } from '../i18n'

interface DifficultyButtonsProps {
  onRate: (difficulty: Difficulty) => void
  disabled?: boolean
}

export default function DifficultyButtons({ onRate, disabled }: DifficultyButtonsProps) {
  const { t } = useTranslation()

  const buttons: { difficulty: Difficulty; labelKey: string; color: string; sublabelKey: string }[] = [
    { difficulty: 'hard', labelKey: 'difficulty.hard', color: '#ff3b30', sublabelKey: 'difficulty.again' },
    { difficulty: 'medium', labelKey: 'difficulty.medium', color: '#ff9500', sublabelKey: 'difficulty.good' },
    { difficulty: 'easy', labelKey: 'difficulty.easy', color: '#34c759', sublabelKey: 'difficulty.easy' },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
    }}>
      {buttons.map(({ difficulty, labelKey, color, sublabelKey }) => (
        <button
          key={difficulty}
          onClick={() => onRate(difficulty)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '14px 8px',
            backgroundColor: `${color}15`,
            border: `2px solid ${color}40`,
            borderRadius: '14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'transform 0.1s, opacity 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color }}>{t(labelKey)}</span>
          <span style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>{t(sublabelKey)}</span>
        </button>
      ))}
    </div>
  )
}
