import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>۴۰۴</h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        صفحه‌ای که دنبال آن بودید پیدا نشد.
      </p>
      <Link to="/" className="btn btn-primary">
        بازگشت به خانه
      </Link>
    </div>
  )
}
