import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell } from '@telegram-apps/telegram-ui'
import { useApp } from '../contexts/AppContext'
import { api } from '../api'
import type { AdminGlobalStats, AdminUserStats } from '../types'

function formatCost(cost: number): string {
  if (cost === 0) return '$0.00'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { isAdmin } = useApp()
  const [stats, setStats] = useState<AdminGlobalStats | null>(null)
  const [users, setUsers] = useState<AdminUserStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true })
      return
    }

    Promise.all([
      api.getAdminStats(),
      api.getAdminUsers(),
    ]).then(([statsData, usersData]) => {
      setStats(statsData)
      setUsers(usersData.users)
    }).catch(() => {
      navigate('/', { replace: true })
    }).finally(() => {
      setLoading(false)
    })
  }, [isAdmin, navigate])

  if (!isAdmin || loading) {
    return (
      <div className="page" style={{ padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', color: 'var(--tg-hint-color)', padding: '40px 0' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'var(--tg-text-color)',
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Admin Dashboard</h1>
      </div>

      {stats && (
        <>
          <Section header="Users">
            <Cell subtitle="Total registered users">{stats.total_users}</Cell>
            <Cell subtitle="Active in last 7 days">{stats.active_users_7d}</Cell>
            <Cell subtitle="New in last 7 days">{stats.new_users_7d}</Cell>
          </Section>

          <Section header="API Usage">
            <Cell subtitle="Total translation calls">{stats.total_translations}</Cell>
            <Cell subtitle="Total image translation calls">{stats.total_image_translations}</Cell>
            <Cell subtitle="Total explanation calls">{stats.total_explanations}</Cell>
            <Cell subtitle="Total estimated cost">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {formatCost(stats.total_cost_usd)}
              </span>
            </Cell>
          </Section>
        </>
      )}

      <Section header="Per-User Statistics">
        {users.length === 0 ? (
          <Cell subtitle="No users found">—</Cell>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              color: 'var(--tg-text-color)',
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--tg-secondary-bg-color)',
                  textAlign: 'left',
                }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Cards</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Trans.</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Img.</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Expl.</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} style={{
                    borderBottom: '1px solid var(--tg-secondary-bg-color)',
                  }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{u.first_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                        {u.username ? `@${u.username}` : `ID: ${u.user_id}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                        Joined {formatDate(u.created_at)}
                        {u.last_active ? ` · Active ${formatDate(u.last_active)}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {u.total_cards}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {u.total_translations}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {u.total_image_translations}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {u.total_explanations}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {formatCost(u.total_cost_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div style={{ height: '80px' }} />
    </div>
  )
}
