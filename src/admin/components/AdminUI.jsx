import { AD_STATUS_LABELS } from '../../lib/constants'
import './AdminUI.css'

export function AdminPageHead({ title, description, action }) {
  return (
    <div className="admin-page-head">
      <div>
        <h1 className="admin-page-head__title">{title}</h1>
        {description && <p className="admin-page-head__desc">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function AdminCard({ children, className = '' }) {
  return <div className={'admin-card ' + className}>{children}</div>
}

const STATUS_PILL_VARIANTS = {
  published: 'on',
  live: 'on',
  approved: 'on',
  draft: 'off',
  pending: 'warn',
  sold: 'sold',
  archived: 'off',
  rejected: 'danger',
}

export function StatusPill({ status }) {
  const variant = STATUS_PILL_VARIANTS[status] || 'off'
  const label = AD_STATUS_LABELS[status] || status
  return <span className={`status-pill status-pill--${variant}`}>{label}</span>
}

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null
  return (
    <div className={'toast toast--' + type} role="status">
      {message}
      <button onClick={onClose} aria-label="بستن پیام">×</button>
    </div>
  )
}
