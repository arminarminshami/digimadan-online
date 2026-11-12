import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoadingBlock } from '../components/StatusBlocks'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingBlock label="در حال بررسی ورود..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return children
}
