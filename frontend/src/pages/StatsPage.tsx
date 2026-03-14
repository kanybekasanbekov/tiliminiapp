import { useState, useEffect } from 'react'
import { Section, Cell } from '@telegram-apps/telegram-ui'
import { useApp } from '../contexts/AppContext'
import { api } from '../api'
import type { UserStats, AccuracyStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'

export default function StatsPage() {
  const { activeLanguagePair, languagePairVersion } = useApp()
  const { t } = useTranslation()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [accuracy, setAccuracy] = useState<AccuracyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getStats(activeLanguagePair),
      api.getAccuracyStats(activeLanguagePair),
    ])
      .then(([statsData, accuracyData]) => {
        setStats(statsData)
        setAccuracy(accuracyData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeLanguagePair, languagePairVersion])

  if (loading) return <LoadingSpinner text={t('stats.loading')} />

  if (!stats) {
    return (
      <div className="page">
        <div style={{ padding: '24px 16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('stats.title')}</h1>
          <p style={{ color: 'var(--tg-hint-color)', marginTop: '8px' }}>
            {t('stats.unableToLoad')}
          </p>
        </div>
      </div>
    )
  }

  const dist = stats.distribution
  const maxVal = Math.max(dist.new, dist.learning, dist.young, dist.mature, 1)

  const bars: { label: string; value: number; color: string; sublabel: string }[] = [
    { label: t('stats.new'), value: dist.new, color: '#007aff', sublabel: t('stats.newSub') },
    { label: t('stats.learning'), value: dist.learning, color: '#ff9500', sublabel: t('stats.learningSub') },
    { label: t('stats.young'), value: dist.young, color: '#34c759', sublabel: t('stats.youngSub') },
    { label: t('stats.mature'), value: dist.mature, color: '#5856d6', sublabel: t('stats.matureSub') },
  ]

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('stats.title')}</h1>
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
          <div style={{ fontSize: '13px', color: 'var(--tg-hint-color)', marginTop: '4px' }}>{t('stats.totalCards')}</div>
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
            {t('stats.dueToday')}
          </div>
        </div>
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: stats.current_streak > 0 ? '#ff9500' : 'var(--tg-secondary-bg-color)',
          borderRadius: '16px',
          textAlign: 'center',
          color: stats.current_streak > 0 ? '#fff' : undefined,
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>
            {stats.current_streak > 0 ? '🔥' : ''} {stats.current_streak}
          </div>
          <div style={{ fontSize: '13px', opacity: stats.current_streak > 0 ? 0.9 : undefined, color: stats.current_streak > 0 ? undefined : 'var(--tg-hint-color)', marginTop: '4px' }}>
            {t('stats.dayStreak')}
          </div>
        </div>
      </div>

      {stats.longest_streak > 0 && (
        <div style={{ padding: '0 16px 8px', fontSize: '13px', color: 'var(--tg-hint-color)', textAlign: 'center' }}>
          {t('stats.longestStreak', { count: stats.longest_streak })}
        </div>
      )}

      <Section header={t('stats.intervalDist')}>
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

      {accuracy && (accuracy.type_mode.total > 0 || accuracy.quiz_mode.total > 0) && (
        <Section header={t('stats.accuracyTitle')}>
          <div style={{ padding: '16px' }}>
            {accuracy.type_mode.total > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '14px',
                }}>
                  <span>{t('practice.modeType')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {Math.round(accuracy.type_mode.accuracy * 100)}% ({accuracy.type_mode.correct}/{accuracy.type_mode.total})
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: 'var(--tg-secondary-bg-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${accuracy.type_mode.accuracy * 100}%`,
                    backgroundColor: '#34c759',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                    minWidth: accuracy.type_mode.total > 0 ? '4px' : '0',
                  }} />
                </div>
              </div>
            )}

            {accuracy.quiz_mode.total > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '14px',
                }}>
                  <span>{t('practice.modeQuiz')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {Math.round(accuracy.quiz_mode.accuracy * 100)}% ({accuracy.quiz_mode.correct}/{accuracy.quiz_mode.total})
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: 'var(--tg-secondary-bg-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${accuracy.quiz_mode.accuracy * 100}%`,
                    backgroundColor: '#007aff',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                    minWidth: accuracy.quiz_mode.total > 0 ? '4px' : '0',
                  }} />
                </div>
              </div>
            )}

            {/* Rolling averages */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
            }}>
              <div style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--tg-secondary-bg-color)',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>
                  {Math.round(accuracy.last_7_days_accuracy * 100)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tg-hint-color)', marginTop: '2px' }}>
                  {t('stats.last7Days')}
                </div>
              </div>
              <div style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--tg-secondary-bg-color)',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>
                  {Math.round(accuracy.last_30_days_accuracy * 100)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tg-hint-color)', marginTop: '2px' }}>
                  {t('stats.last30Days')}
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section header={t('stats.srsOverview')}>
        <Cell subtitle={t('stats.srs')}>{t('stats.srsAlgorithm')}</Cell>
        <Cell subtitle={t('stats.difficultyValues')}>{t('stats.difficultyRatings')}</Cell>
        <Cell subtitle={t('stats.learningCurveSub')}>{t('stats.learningCurve')}</Cell>
      </Section>
    </div>
  )
}
