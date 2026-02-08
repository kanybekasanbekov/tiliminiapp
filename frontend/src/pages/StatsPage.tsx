import { useState, useEffect } from 'react'
import { Section, Cell } from '@telegram-apps/telegram-ui'
import { api } from '../api'
import type { UserStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading stats..." />

  if (!stats) {
    return (
      <div className="page">
        <div style={{ padding: '24px 16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Statistics</h1>
          <p style={{ color: 'var(--tg-hint-color)', marginTop: '8px' }}>
            Unable to load statistics.
          </p>
        </div>
      </div>
    )
  }

  const dist = stats.distribution
  const maxVal = Math.max(dist.new, dist.learning, dist.young, dist.mature, 1)

  const bars: { label: string; value: number; color: string; sublabel: string }[] = [
    { label: 'New', value: dist.new, color: '#007aff', sublabel: '0 days' },
    { label: 'Learning', value: dist.learning, color: '#ff9500', sublabel: '1-6 days' },
    { label: 'Young', value: dist.young, color: '#34c759', sublabel: '7-30 days' },
    { label: 'Mature', value: dist.mature, color: '#5856d6', sublabel: '30+ days' },
  ]

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Statistics</h1>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '0 16px 16px',
      }}>
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: 'var(--tg-secondary-bg-color)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: '13px', color: 'var(--tg-hint-color)', marginTop: '4px' }}>Total Cards</div>
        </div>
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: stats.due > 0 ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
          borderRadius: '16px',
          textAlign: 'center',
          color: stats.due > 0 ? '#fff' : undefined,
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.due}</div>
          <div style={{ fontSize: '13px', opacity: stats.due > 0 ? 0.9 : undefined, color: stats.due > 0 ? undefined : 'var(--tg-hint-color)', marginTop: '4px' }}>
            Due Today
          </div>
        </div>
      </div>

      <Section header="Interval Distribution">
        <div style={{ padding: '16px' }}>
          {bars.map(({ label, value, color, sublabel }) => (
            <div key={label} style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '14px',
              }}>
                <span>
                  {label} <span style={{ color: 'var(--tg-hint-color)', fontSize: '12px' }}>({sublabel})</span>
                </span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: 'var(--tg-secondary-bg-color)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(value / maxVal) * 100}%`,
                  backgroundColor: color,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                  minWidth: value > 0 ? '4px' : '0',
                }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section header="SRS Overview">
        <Cell subtitle="Spaced Repetition System">Algorithm: SM-2 (Anki)</Cell>
        <Cell subtitle="Easy = 5, Medium = 3, Hard = 1">Difficulty Ratings</Cell>
        <Cell subtitle="Reviews increase intervals exponentially">Learning Curve</Cell>
      </Section>
    </div>
  )
}
