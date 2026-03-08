import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell, Badge } from '@telegram-apps/telegram-ui'
import { useApp } from '../contexts/AppContext'
import { api } from '../api'
import { getLanguageNames } from '../utils/languages'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, dueCount, setDueCount, activeLanguagePair, languagePairVersion, langSwitchMessage, setLangSwitchMessage } = useApp()
  const [streak, setStreak] = useState(0)
  const lang = getLanguageNames(activeLanguagePair)

  useEffect(() => {
    api.getStats(activeLanguagePair).then((stats) => {
      setDueCount(stats.due)
      setStreak(stats.current_streak)
    }).catch(() => {})
  }, [setDueCount, activeLanguagePair, languagePairVersion])

  // Auto-clear language switch toast
  useEffect(() => {
    if (!langSwitchMessage) return
    const timer = setTimeout(() => setLangSwitchMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [langSwitchMessage, setLangSwitchMessage])

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>
            Hello{user ? `, ${user.first_name}` : ''}!
          </h1>
          <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '15px' }}>
            Ready to learn? <span style={{ fontSize: '13px', fontWeight: 600 }}>{lang.source} → {lang.target}</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'var(--tg-hint-color)',
            lineHeight: 1,
          }}
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>

      {langSwitchMessage && (
        <div style={{
          margin: '0 16px 12px',
          padding: '12px 16px',
          backgroundColor: '#34c75920',
          borderRadius: '12px',
          color: '#34c759',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {langSwitchMessage}
        </div>
      )}

      {streak > 0 && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'var(--tg-secondary-bg-color)',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            🔥 {streak} day streak
          </span>
        </div>
      )}

      {dueCount > 0 && (
        <div
          onClick={() => navigate('/practice')}
          style={{
            margin: '0 16px 16px',
            padding: '20px',
            background: 'linear-gradient(135deg, var(--tg-button-color), #6366f1)',
            borderRadius: '16px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Cards due for review</div>
          <div style={{ fontSize: '36px', fontWeight: 700, margin: '4px 0' }}>{dueCount}</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Tap to start practicing</div>
        </div>
      )}

      <Section header="Quick Actions">
        <Cell
          onClick={() => navigate('/add')}
          before={<span style={{ fontSize: '24px' }}>➕</span>}
          subtitle="Translate and save a new word"
        >
          Add New Card
        </Cell>
        <Cell
          onClick={() => navigate('/practice')}
          before={<span style={{ fontSize: '24px' }}>📖</span>}
          subtitle={dueCount > 0 ? `${dueCount} cards due` : 'No cards due'}
          after={dueCount > 0 ? <Badge type="number">{dueCount}</Badge> : undefined}
        >
          Practice
        </Cell>
        <Cell
          onClick={() => navigate('/decks')}
          before={<span style={{ fontSize: '24px' }}>🗂</span>}
          subtitle="Organize and browse your flashcard decks"
        >
          My Decks
        </Cell>
        <Cell
          onClick={() => navigate('/stats')}
          before={<span style={{ fontSize: '24px' }}>📊</span>}
          subtitle="Track your learning progress"
        >
          Statistics
        </Cell>
      </Section>
    </div>
  )
}
