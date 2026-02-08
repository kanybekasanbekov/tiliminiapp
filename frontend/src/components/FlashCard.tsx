import type { Flashcard } from '../types'

interface FlashCardProps {
  card: Flashcard
  showSide: 'korean' | 'english'
  revealed: boolean
}

export default function FlashCard({ card, showSide, revealed }: FlashCardProps) {
  const question = showSide === 'korean' ? card.korean : card.english
  const questionLabel = showSide === 'korean' ? 'Korean' : 'English'
  const prompt = showSide === 'korean'
    ? 'What does this mean in English?'
    : 'How do you say this in Korean?'

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
              fontSize: showSide === 'korean' ? '32px' : '24px',
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
                Korean
              </span>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>
                {card.korean}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--tg-hint-color)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                English
              </span>
              <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>
                {card.english}
              </div>
            </div>

            {card.example_kr && (
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
                  Example
                </span>
                <div style={{ fontSize: '16px', marginTop: '4px', lineHeight: 1.5 }}>
                  {card.example_kr}
                </div>
                {card.example_en && (
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--tg-hint-color)',
                    marginTop: '4px',
                    fontStyle: 'italic',
                  }}>
                    {card.example_en}
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
