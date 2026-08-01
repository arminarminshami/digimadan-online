import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './admin/AuthContext'
import ProtectedRoute from './admin/ProtectedRoute'
import AdminLayout from './admin/AdminLayout'
import PublicLayout from './components/PublicLayout'

import Home from './pages/Home'
import Ads from './pages/Ads'
import AdDetail from './pages/AdDetail'
import Minerals from './pages/Minerals'
import Auctions from './pages/Auctions'
import AuctionDetail from './pages/AuctionDetail'
import AuctionParticipate from './pages/AuctionParticipate'
import SearchResults from './pages/SearchResults'
import SubmitAd from './pages/SubmitAd'
import Dashboard from './pages/Dashboard'
import Prices from './pages/Prices'
import News from './pages/News'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import ContentPage from './pages/ContentPage'
import AboutContent from './lib/AboutContent'
import Contact from './pages/Contact'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminAdsList from './admin/pages/AdminAdsList'
import AdminAdForm from './admin/pages/AdminAdForm'
import AdminUsersList from './admin/pages/AdminUsersList'
import AdminUserForm from './admin/pages/AdminUserForm'
import AdminBanners from './admin/pages/AdminBanners'
import AdminSettings from './admin/pages/AdminSettings'
import AdminSmsLog from './admin/pages/AdminSmsLog'
import AdminBulkSms from './admin/pages/AdminBulkSms'
import AdminAuctionsList from './admin/pages/AdminAuctionsList'
import AdminAuctionForm from './admin/pages/AdminAuctionForm'
import AdminAuctionParticipants from './admin/pages/AdminAuctionParticipants'
import AdminSmsPatterns from './admin/pages/AdminSmsPatterns'
import AdminPrices from './admin/pages/AdminPrices'
import AdminWallets from './admin/pages/AdminWallets'
import AdminContent from './admin/pages/AdminContent'
import AdminPagesList from './admin/pages/AdminPagesList'
import AdminPageForm from './admin/pages/AdminPageForm'

// Old /messages links (e.g. from before the chat moved into the user panel) now
// redirect into the dashboard's "پیام‌ها و گفتگو" tab, keeping the thread id if present.
function LegacyMessagesRedirect() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const thread = params.get('thread')
  const target = thread ? `/dashboard?tab=messages&thread=${thread}` : '/dashboard?tab=messages'
  return <Navigate to={target} replace />
}

// هر بار مسیر عوض می‌شود (کلیک روی لینک/منو)، صفحه از بالا نمایش داده شود
// نه از همان جایی که صفحه‌ی قبلی اسکرول شده بود.
function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return null
}

function AdminShell({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/ads" element={<PublicLayout><Ads /></PublicLayout>} />
        <Route path="/ads/:id" element={<PublicLayout><AdDetail /></PublicLayout>} />
        <Route path="/auctions" element={<PublicLayout><Auctions /></PublicLayout>} />
        <Route path="/auctions/:id" element={<PublicLayout><AuctionDetail /></PublicLayout>} />
        <Route path="/auctions/:id/participate" element={<PublicLayout><AuctionParticipate /></PublicLayout>} />
        <Route path="/minerals" element={<PublicLayout><Minerals /></PublicLayout>} />
        <Route path="/search" element={<PublicLayout><SearchResults /></PublicLayout>} />
        <Route path="/page/:slug" element={<PublicLayout><ContentPage /></PublicLayout>} />
        <Route path="/submit-ad" element={<PublicLayout><SubmitAd /></PublicLayout>} />
        <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />
        <Route path="/messages" element={<LegacyMessagesRedirect />} />
        <Route path="/prices" element={<PublicLayout><Prices /></PublicLayout>} />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <ContentPage slug="about" fallbackTitle="درباره ما" fallbackContent={<AboutContent />} />
            </PublicLayout>
          }
        />
        <Route
          path="/news"
          element={<PublicLayout><News /></PublicLayout>}
        />
        <Route path="/articles" element={<PublicLayout><Articles /></PublicLayout>} />
        <Route path="/articles/:slug" element={<PublicLayout><ArticleDetail /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel (protected) */}
        <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
        <Route path="/admin/ads" element={<AdminShell><AdminAdsList /></AdminShell>} />
        <Route path="/admin/ads/new" element={<AdminShell><AdminAdForm /></AdminShell>} />
        <Route path="/admin/ads/:id/edit" element={<AdminShell><AdminAdForm /></AdminShell>} />
        <Route path="/admin/auctions" element={<AdminShell><AdminAuctionsList /></AdminShell>} />
        <Route path="/admin/auctions/new" element={<AdminShell><AdminAuctionForm /></AdminShell>} />
        <Route path="/admin/auctions/:id/edit" element={<AdminShell><AdminAuctionForm /></AdminShell>} />
        <Route path="/admin/auctions/:id/participants" element={<AdminShell><AdminAuctionParticipants /></AdminShell>} />
        <Route path="/admin/users" element={<AdminShell><AdminUsersList /></AdminShell>} />
        <Route path="/admin/users/new" element={<AdminShell><AdminUserForm /></AdminShell>} />
        <Route path="/admin/users/:id/edit" element={<AdminShell><AdminUserForm /></AdminShell>} />
        <Route path="/admin/banners" element={<AdminShell><AdminBanners /></AdminShell>} />
        <Route path="/admin/send-sms" element={<AdminShell><AdminBulkSms /></AdminShell>} />
        <Route path="/admin/sms-patterns" element={<AdminShell><AdminSmsPatterns /></AdminShell>} />
        <Route path="/admin/sms" element={<AdminShell><AdminSmsLog /></AdminShell>} />
        <Route path="/admin/wallets" element={<AdminShell><AdminWallets /></AdminShell>} />
        <Route path="/admin/prices" element={<AdminShell><AdminPrices /></AdminShell>} />
        <Route path="/admin/settings" element={<AdminShell><AdminSettings /></AdminShell>} />
        <Route path="/admin/content" element={<AdminShell><AdminContent /></AdminShell>} />
        <Route path="/admin/pages" element={<AdminShell><AdminPagesList /></AdminShell>} />
        <Route path="/admin/pages/new" element={<AdminShell><AdminPageForm /></AdminShell>} />
        <Route path="/admin/pages/:id/edit" element={<AdminShell><AdminPageForm /></AdminShell>} />

        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
    </AuthProvider>
  )
}
