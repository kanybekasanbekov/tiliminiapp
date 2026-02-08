export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="loading-container">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        {text && (
          <p style={{ marginTop: '12px', color: 'var(--tg-hint-color)', fontSize: '14px' }}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
