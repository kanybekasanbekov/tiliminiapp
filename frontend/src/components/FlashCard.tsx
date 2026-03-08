import type { Flashcard } from '../types'
import { getLanguageNames } from '../utils/languages'
import { useTranslation } from '../i18n'
import { useApp } from '../contexts/AppContext'

interface FlashCardProps {
  card: Flashcard
  showSide: 'source' | 'target'
  revealed: boolean
}

export default function FlashCard({ card, showSide, revealed }: FlashCardProps) {
  const { appLanguage } = useApp()
  const { t } = useTranslation()
  const lang = getLanguageNames(card.language_pair, appLanguage)
  const question = showSide === 'source' ? card.source_text : card.target_text
  const questionLabel = showSide === 'source' ? lang.source : lang.target
  const prompt = showSide === 'source'
    ? t('flashcard.whatDoesThisMean', { lang: lang.target, langPrep: lang.targetPrep })
    : t('flashcard.whatDoesThisMean', { lang: lang.source, langPrep: lang.sourcePrep })

  return (
    <div style={{
      perspective: '1000px',
      minHeight: '280px',
    }}>
      <div style={{
        backgroundColor: 'var(--tg-secondary-bg-color)',
        borderRadius: '20px',
        padding: '32px 24px',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.4s ease',
        transform: revealed ? 'rotateX(0deg)' : 'rotateX(0deg)',
      }}>
        {!revealed ? (
          <>
            <span style={{
              fontSize: '12px',
              color: 'var(--tg-hint-color)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              {questionLabel}
            </span>
            <span style={{
              fontSize: showSide === 'source' ? '32px' : '24px',
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: '16px',
            }}>
              {question}
            </span>
            <span style={{
              fontSize: '14px',
              color: 'var(--tg-hint-color)',
            }}>
              {prompt}
            </span>
          </>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--tg-hint-color)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {lang.source}
              </span>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>
                {card.source_text}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--tg-hint-color)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {lang.target}
              </span>
              <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>
                {card.target_text}
              </div>
            </div>

            {card.example_source && (
              <div style={{
                borderTop: '1px solid var(--tg-bg-color)',
                paddingTop: '16px',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--tg-hint-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {t('flashcard.example')}
                </span>
                <div style={{ fontSize: '16px', marginTop: '4px', lineHeight: 1.5 }}>
                  {card.example_source}
                </div>
                {card.example_target && (
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--tg-hint-color)',
                    marginTop: '4px',
                    fontStyle: 'italic',
                  }}>
                    {card.example_target}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
