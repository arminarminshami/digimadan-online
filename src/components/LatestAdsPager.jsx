import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AdCard from './AdCard'
import { LoadingBlock, EmptyBlock, ErrorBlock } from './StatusBlocks'
import './LatestAdsPager.css'

const PAGE_SIZE = 18 // ۳ ردیف × ۶ آگهی

// لیست صفحه‌ها با «…» برای وقتی که صفحه‌ها زیاد است: ۱ … ۴ ۵ ۶ … ۱۲
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p)
    out.push(p)
  })
  return out
}

export default function LatestAdsPager() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const [ads, setAds] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const topRef = useRef(null)
  const prevPage = useRef(page)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // همان فیلتر لیست آگهی‌ها: فقط آگهی‌های منتشرشده، مرتب از جدید به قدیم
    supabase
      .from('ads')
      .select('*', { count: 'exact' })
      .in('status', ['published', 'live'])
      .eq('is_archived', false)
      .order('ranked_at', { ascending: false })
      .range(from, to)
      .then(({ data, count, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(true)
        } else {
          setAds(data || [])
          setTotal(count || 0)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageList = useMemo(() => buildPageList(Math.min(page, totalPages), totalPages), [page, totalPages])

  function goTo(p) {
    if (p < 1 || p > totalPages || p === page) return
    const next = new URLSearchParams(searchParams)
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
  }

  // بعد از تعویض صفحه، به ابتدای لیست آگهی‌ها برگردیم (نه بالای کل سایت)
  useEffect(() => {
    // فقط وقتی کاربر واقعاً صفحه را عوض کرده (نه در بارگذاری اول) اسکرول کن
    if (prevPage.current === page) return
    prevPage.current = page
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  return (
    <div ref={topRef} className="latest-ads">
      {loading && ads.length === 0 && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
      {error && <ErrorBlock message="دریافت آگهی‌ها با خطا مواجه شد." />}
      {!loading && !error && ads.length === 0 && (
        <EmptyBlock
          title={page > 1 ? 'آگهی‌ای در این صفحه نیست' : 'هنوز آگهی‌ای ثبت نشده'}
          hint={page > 1 ? 'به صفحه‌ی اول برگردید.' : 'به‌زودی آگهی‌های جدید اضافه خواهند شد.'}
        />
      )}

      {!error && ads.length > 0 && (
        <div className={'ad-grid ad-grid--six' + (loading ? ' ad-grid--loading' : '')}>
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {!error && totalPages > 1 && (
        <nav className="pager" aria-label="صفحه‌بندی آگهی‌ها">
          <button
            type="button"
            className="pager__btn pager__btn--nav"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            صفحه قبل
          </button>

          <div className="pager__pages">
            {pageList.map((p) =>
              typeof p === 'string' ? (
                <span key={p} className="pager__gap">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={'pager__btn pager__btn--num' + (p === page ? ' pager__btn--active' : '')}
                  onClick={() => goTo(p)}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`صفحه ${p.toLocaleString('fa-IR')}`}
                >
                  {p.toLocaleString('fa-IR')}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="pager__btn pager__btn--nav"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            صفحه بعد
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  )
}
