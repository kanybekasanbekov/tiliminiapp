import type { Flashcard } from '../types'
import { getLanguageNames } from '../utils/languages'
import { useTranslation } from '../i18n'
import { useApp } from '../contexts/AppContext'
import SpeakerButton from './SpeakerButton'

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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <span style={{
                fontSize: showSide === 'source' ? '32px' : '24px',
                fontWeight: 700,
                lineHeight: 1.3,
              }}>
                {question}
              </span>
              {showSide === 'source' && (
                <SpeakerButton
                  text={question}
                  lang={card.language_pair.split('-')[0]}
                />
              )}
            </div>
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
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{card.source_text}</span>
                <SpeakerButton
                  text={card.source_text}
                  lang={card.language_pair.split('-')[0]}
                  size="small"
                />
                {card.part_of_speech && (
                  <span style={{
                    display: 'inline-block',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--tg-button-color)',
                    color: 'var(--tg-button-text-color)',
                    fontWeight: 500,
                    opacity: 0.85,
                  }}>
                    {card.part_of_speech}
                  </span>
                )}
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
