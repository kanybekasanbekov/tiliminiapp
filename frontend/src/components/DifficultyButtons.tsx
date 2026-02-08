import type { Difficulty } from '../types'

interface DifficultyButtonsProps {
  onRate: (difficulty: Difficulty) => void
  disabled?: boolean
}

const buttons: { difficulty: Difficulty; label: string; color: string; sublabel: string }[] = [
  { difficulty: 'hard', label: 'Hard', color: '#ff3b30', sublabel: 'Again' },
  { difficulty: 'medium', label: 'Medium', color: '#ff9500', sublabel: 'Good' },
  { difficulty: 'easy', label: 'Easy', color: '#34c759', sublabel: 'Easy' },
]

export default function DifficultyButtons({ onRate, disabled }: DifficultyButtonsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
    }}>
      {buttons.map(({ difficulty, label, color, sublabel }) => (
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
          <span style={{ fontSize: '16px', fontWeight: 700, color }}>{label}</span>
          <span style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>{sublabel}</span>
        </button>
      ))}
    </div>
  )
}
