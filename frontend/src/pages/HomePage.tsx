import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell, Badge } from '@telegram-apps/telegram-ui'
import { useApp } from '../contexts/AppContext'
import { api } from '../api'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, dueCount, setDueCount } = useApp()

  useEffect(() => {
    api.getStats().then((stats) => {
      setDueCount(stats.due)
    }).catch(() => {})
  }, [setDueCount])

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>
          Hello{user ? `, ${user.first_name}` : ''}!
        </h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '15px' }}>
          Ready to learn Korean?
        </p>
      </div>

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
          subtitle="Translate and save a Korean word"
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
          onClick={() => navigate('/cards')}
          before={<span style={{ fontSize: '24px' }}>🗂</span>}
          subtitle="View and manage your flashcards"
        >
          My Cards
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
