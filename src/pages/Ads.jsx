import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getPublicListings } from '../services/auctionsService'
import AdCard from '../components/AdCard'
import SearchableSelect from '../components/SearchableSelect'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import {
  AD_CATEGORIES,
  PROVINCES,
  MINERAL_TYPES,
  AD_TYPES,
  getTypeFilterConfig,
  normalizeTypeItems,
} from '../lib/constants'
import { useSeo, buildItemListJsonLd } from '../lib/useSeo'
import './Ads.css'

export default function Ads() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const province = searchParams.get('province') || ''
  const mineralType = searchParams.get('mineralType') || ''
  const machineType = searchParams.get('machineType') || ''
  const adType = searchParams.get('adType') || ''

  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const isOther = mineralType === 'سایر'
    // «سایر» یعنی آگهی‌هایی که نوع ماده‌شان با هیچ‌کدام از فهرست استاندارد
    // مطابقت ندارد؛ چون این یک منطق «NOT IN» روی متن آزاد فارسی است، برای
    // اطمینان کامل آن را در سمت کلاینت فیلتر می‌کنیم نه در کوئری دیتابیس.
    getPublicListings({
      category: category || undefined,
      province: province || undefined,
      mineralType: mineralType && !isOther ? mineralType : undefined,
      machineType: machineType || undefined,
      adType: adType || undefined,
    })
      .then((data) => {
        if (!mounted) return
        if (isOther) {
          const known = new Set(MINERAL_TYPES.filter((m) => m !== 'سایر'))
          setAds(data.filter((ad) => !ad.mineral_type || !known.has(ad.mineral_type.trim())))
        } else {
          setAds(data)
        }
      })
      .catch((err) => mounted && setError('دریافت آگهی‌ها با خطا مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [category, province, mineralType, machineType, adType])

  // فیلترِ نوع، متناسب با دسته‌بندی فعلی
  const typeFilter = getTypeFilterConfig(category)

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)

    // با عوض شدن دسته‌بندی، فیلترِ نوعِ دسته‌ی قبلی باید پاک شود؛
    // وگرنه مثلا «نوع ماده معدنی = طلا» روی دسته‌ی ماشین‌آلات باقی
    // می‌ماند و نتیجه‌ی خالی نشان می‌دهد.
    if (key === 'category') {
      next.delete('mineralType')
      next.delete('machineType')
    }

    setSearchParams(next)
  }

  const activeCategoryLabel = useMemo(
    () => AD_CATEGORIES.find((c) => c.value === category)?.label,
    [category]
  )

  const pageTitle = mineralType
    ? `آگهی‌های ${mineralType}`
    : activeCategoryLabel || 'تمام آگهی‌های معدن'

  useSeo({
    title: pageTitle,
    description: mineralType
      ? `خرید و فروش ${mineralType} در ایران — آگهی‌های معدنی دیجی‌معدن با قیمت و تناژ مشخص.`
      : 'آگهی‌های خرید و فروش مواد معدنی، معادن و ماشین‌آلات معدنی در سراسر ایران.',
    path: '/ads',
    jsonLd: buildItemListJsonLd(ads, pageTitle),
  })

  return (
    <div className="ads-page">
      <div className="ads-page__head">
        <div className="container">
          <span className="section-eyebrow">آگهی‌ها</span>
          <h1 className="section-title">{pageTitle}</h1>
          {mineralType && (
            <Link to="/minerals" className="section-link">
              ← بازگشت به فهرست مواد معدنی
            </Link>
          )}
        </div>
      </div>

      <div className="container ads-page__body">
        <aside className="ads-filters">
          <div className="ads-filters__group">
            <label className="ads-filters__label">نوع آگهی</label>
            <select value={adType} onChange={(e) => updateFilter('adType', e.target.value)}>
              <option value="">همه (فروش و خرید)</option>
              {AD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="ads-filters__group">
            <label className="ads-filters__label">دسته‌بندی</label>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">همه دسته‌ها</option>
              {AD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ads-filters__group">
            <label className="ads-filters__label">استان</label>
            <select
              value={province}
              onChange={(e) => updateFilter('province', e.target.value)}
            >
              <option value="">همه استان‌ها</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/*
            فیلترِ «نوع» بسته به دسته‌بندی انتخاب‌شده عوض می‌شود:
            معادن -> نوع معدن، ماشین‌آلات -> نوع ماشین‌آلات،
            مواد معدنی -> نوع ماده معدنی. برای دسته‌های ساده
            (اکتشاف/استخراج و مشارکت) اصلا نمایش داده نمی‌شود.
          */}
          {typeFilter && (
            <div className="ads-filters__group">
              <label className="ads-filters__label">{typeFilter.label}</label>
              <SearchableSelect
                groups={typeFilter.groups}
                value={typeFilter.param === 'machineType' ? machineType : mineralType}
                onChange={(v) => updateFilter(typeFilter.param, v)}
                placeholder={typeFilter.placeholder}
                extraOption={{ value: 'سایر', label: 'سایر' }}
              />
            </div>
          )}

          {(category || province || mineralType || machineType || adType) && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSearchParams({})}
            >
              حذف فیلترها
            </button>
          )}
        </aside>

        <div className="ads-results">
          {loading && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
          {error && <ErrorBlock message="دریافت آگهی‌ها با خطا مواجه شد." />}
          {!loading && !error && ads.length === 0 && (
            <EmptyBlock
              title="آگهی‌ای با این فیلتر یافت نشد"
              hint="فیلتر دیگری را امتحان کنید یا بعداً دوباره سر بزنید."
            />
          )}
          {!loading && !error && ads.length > 0 && (
            <>
              <p className="ads-results__count">{ads.length} آگهی یافت شد</p>
              <div className="ad-grid">
                {ads.map((ad, i) => (
                  <div
                    key={ad.id}
                    className="ad-grid__item"
                    style={{ '--stagger': Math.min(i, 8) }}
                  >
                    <AdCard ad={ad} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
