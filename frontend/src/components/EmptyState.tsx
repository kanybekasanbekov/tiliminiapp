interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span style={{ fontSize: '48px' }}>{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            backgroundColor: 'var(--tg-button-color)',
            color: 'var(--tg-button-text-color)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
