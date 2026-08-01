import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginWithPassword } from '../../services/authService'
import './AdminLogin.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from || '/admin'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError('ایمیل یا رمز عبور اشتباه است.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <div className="admin-login__brand">
          <img src="/logo.png" alt="دیجی‌معدن" className="admin-login__brand-mark" />
          <span>دیجی‌معدن</span>
        </div>
        <h1 className="admin-login__title">ورود به پنل مدیریت</h1>
        <p className="admin-login__hint">برای مدیریت آگهی‌ها و محتوای سایت وارد شوید.</p>

        <label className="admin-field">
          <span>ایمیل</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@digimadan.com"
            autoComplete="username"
          />
        </label>

        <label className="admin-field">
          <span>رمز عبور</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="admin-login__error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  )
}
