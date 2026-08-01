import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicListings } from '../services/auctionsService'
import AdCard from '../components/AdCard'
import SearchableSelect from '../components/SearchableSelect'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import {
  AD_CATEGORIES,
  MINERAL_TYPES,
  getTypeFilterConfig,
  normalizeTypeItems,
} from '../lib/constants'
import { useSeo, buildItemListJsonLd } from '../lib/useSeo'
import './Minerals.css'

export default function Minerals() {
  const [searchParams, setSearchParams] = useSearchParams()
  // این صفحه به‌صورت پیش‌فرض روی «مواد معدنی» است، ولی می‌تواند هر
  // دسته‌بندی دیگری را هم نشان دهد و فیلترِ نوعش خودکار عوض می‌شود.
  const category = searchParams.get('category') || 'mineral_materials'
  const mineralType = searchParams.get('mineralType') || ''
  const machineType = searchParams.get('machineType') || ''

  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const typeFilter = getTypeFilterConfig(category)
  const categoryLabel = AD_CATEGORIES.find((c) => c.value === category)?.label || 'مواد معدنی'

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const isOther = mineralType === 'سایر'
    // «سایر» یعنی آگهی‌هایی که نوعشان با هیچ‌کدام از فهرست استاندارد
    // مطابقت ندارد؛ چون منطق «NOT IN» روی متن آزاد فارسی است، در سمت
    // کلاینت فیلتر می‌شود.
    getPublicListings({
      category,
      mineralType: mineralType && !isOther ? mineralType : undefined,
      machineType: machineType || undefined,
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
      .catch(() => mounted && setError('دریافت آگهی‌ها با خطا مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [category, mineralType, machineType])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    // با عوض شدن دسته‌بندی، فیلترِ نوعِ دسته‌ی قبلی باید پاک شود
    if (key === 'category') {
      next.delete('mineralType')
      next.delete('machineType')
    }
    setSearchParams(next)
  }

  const activeType = typeFilter?.param === 'machineType' ? machineType : mineralType

  useSeo({
    title: activeType ? `آگهی‌های ${activeType}` : categoryLabel,
    description: activeType
      ? `خرید و فروش ${activeType} — تمام آگهی‌های ${activeType} در دیجی‌معدن.`
      : `فهرست کامل آگهی‌های ${categoryLabel} در سراسر ایران، همراه با قیمت و مشخصات.`,
    path: '/minerals',
    jsonLd: buildItemListJsonLd(ads, activeType ? `آگهی‌های ${activeType}` : categoryLabel),
  })

  return (
    <div className="minerals-page">
      <div className="minerals-page__head">
        <div className="container">
          <span className="section-eyebrow">دسته‌بندی</span>
          <h1 className="section-title">{categoryLabel}</h1>
          <p className="minerals-page__subtitle">
            ابتدا دسته‌بندی را انتخاب کنید؛ فهرست نوع‌ها متناسب با همان دسته‌بندی تغییر می‌کند.
          </p>
        </div>
      </div>

      <div className="container minerals-page__body">
        <div className="minerals-select-row">
          <label className="minerals-select-row__label" htmlFor="category-select">
            دسته‌بندی
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
          >
            {AD_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {typeFilter && (
            <>
              <label className="minerals-select-row__label">{typeFilter.label}</label>
              <div className="minerals-select-row__picker">
                <SearchableSelect
                  groups={typeFilter.groups}
                  value={activeType}
                  onChange={(v) => updateParam(typeFilter.param, v)}
                  placeholder={typeFilter.placeholder}
                  extraOption={{ value: 'سایر', label: 'سایر' }}
                />
              </div>
            </>
          )}

          {activeType && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => updateParam(typeFilter.param, '')}
            >
              حذف فیلتر
            </button>
          )}
        </div>

        {loading && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
        {error && <ErrorBlock message="دریافت آگهی‌ها با خطا مواجه شد." />}
        {!loading && !error && ads.length === 0 && (
          <EmptyBlock
            title="آگهی‌ای در این دسته یافت نشد"
            hint="دسته‌بندی یا نوع دیگری را انتخاب کنید."
          />
        )}
        {!loading && !error && ads.length > 0 && (
          <>
            <p className="ads-results__count">{ads.length} آگهی یافت شد</p>
            <div className="ad-grid">
              {ads.map((ad, i) => (
                <div key={ad.id} className="ad-grid__item" style={{ '--stagger': Math.min(i, 8) }}>
                  <AdCard ad={ad} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
