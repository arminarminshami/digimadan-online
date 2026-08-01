import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicListings } from '../services/auctionsService'
import { getAllPrices } from '../services/priceService'
import { getActiveBanners } from '../services/bannerService'
import AdCard from '../components/AdCard'
import DepthSection from '../components/DepthSection'
import GlobalSearchBar from '../components/GlobalSearchBar'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import { AD_CATEGORIES, HOME_MAIN_PRICE_KEYS, HOME_METAL_PRICE_KEYS } from '../lib/constants'
import { useSeo, SITE_URL, SITE_NAME } from '../lib/useSeo'
import './Home.css'

const CATEGORY_ICONS = {
  mineral_materials: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 3h12l3 6-9 12L3 9l3-6Z" />
      <path d="M3 9h18M9 3l3 6 3-6M12 9v12" />
    </svg>
  ),
  mines: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 20L9 8l4 7 3-6 5 11H3Z" />
    </svg>
  ),
  partnership_investment: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="9" r="3" />
      <circle cx="17" cy="9" r="3" />
      <path d="M2 20c0-3 2.7-5 6-5s6 2 6 5M11 20c0-2.4 2-4.4 4.5-4.4S20 17.6 20 20" />
    </svg>
  ),
  exploration_operations: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  extraction_operations: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z" />
    </svg>
  ),
}

function formatPriceValue(item) {
  const v = item.price_values?.[0] || item.price_values
  if (!v || v.current_value == null) return '—'
  return Number(v.current_value).toLocaleString('fa-IR') + (item.unit ? ` ${item.unit}` : '')
}

function priceChangePercent(item) {
  const v = item.price_values?.[0] || item.price_values
  return v?.change_percent ?? null
}

// ترتیب و انتخاب دقیق آیتم‌های صفحه‌ی اصلی از constants.js می‌آید تا با
// نوار قیمت بالای هدر سایت (PriceTicker.jsx) دقیقاً یکسان بماند.
function pickOrderedPrices(prices, keys) {
  const byKey = Object.fromEntries(prices.map((p) => [p.key, p]))
  return keys.map((k) => byKey[k]).filter(Boolean)
}

export default function Home() {
  const [ads, setAds] = useState([])
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [banners, setBanners] = useState([])
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    getActiveBanners()
      .then(setBanners)
      .catch(() => setBanners([]))
  }, [])

  // چرخش خودکار بنرها هر ۶ ثانیه، فقط وقتی بیش از یک بنر فعال داریم
  useEffect(() => {
    if (banners.length < 2) return
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [banners])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [adsData, pricesData] = await Promise.all([
          getPublicListings({ limit: 10 }),
          getAllPrices().catch(() => []),
        ])
        if (!mounted) return
        setAds(adsData)
        setPrices(pricesData)
      } catch (err) {
        if (mounted) setError('بارگذاری اطلاعات صفحه اصلی با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const featuredAds = ads.slice(0, 10)

  // صفحه‌ی اصلی: معرفی سازمان به گوگل تا سایت به‌عنوان یک کسب‌وکار شناخته شود
  useSeo({
    description:
      'دیجی‌معدن، بازار آنلاین آگهی‌های معدنی ایران: خرید و فروش مواد معدنی، معادن، ماشین‌آلات معدنی و قیمت لحظه‌ای فلزات.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'fa-IR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      },
    },
  })

  return (
    <>
      {/* Hero banner — یک تصویر افقی بزرگ با متن روی آن؛ اگر چند بنر فعال باشد، خودکار می‌چرخد */}
      <section className="hero-banner">
        {banners.length > 0 ? (
          banners.map((b, i) => (
            <img
              key={b.id}
              src={b.image_url}
              alt="دیجی‌معدن"
              className={'hero-banner__img' + (i === bannerIndex ? ' hero-banner__img--active' : '')}
            />
          ))
        ) : (
          <img src="/banner.jpg" alt="دیجی‌معدن" className="hero-banner__img hero-banner__img--active" />
        )}
        <div className="hero-banner__overlay" />
        <div className="container hero-banner__content">
          <h1 className="sr-only">
            دیجی‌معدن — بازار آگهی‌های معدن ایران: خرید، فروش و مشارکت در صنعت معدن
          </h1>
          <div className="hero-banner__actions">
            <Link to="/ads" className="btn btn-primary">
              مشاهده آگهی‌ها
            </Link>
            <Link to="/submit-ad" className="btn btn-outline">
              ثبت آگهی
            </Link>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="hero-banner__dots">
            {banners.map((b, i) => (
              <button
                key={b.id}
                className={'hero-banner__dot' + (i === bannerIndex ? ' hero-banner__dot--active' : '')}
                onClick={() => setBannerIndex(i)}
                aria-label={`نمایش بنر ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Global site search */}
      <div className="container home-search-row">
        <GlobalSearchBar />
      </div>

      {/* Categories */}
      <DepthSection className="section section--tight" depth={0.7}>
        <div className="container">
          <div className="cat-row">
            {AD_CATEGORIES.map((cat) => (
              <Link key={cat.value} to={`/minerals?category=${cat.value}`} className="cat-chip">
                <span className="cat-chip__icon">{CATEGORY_ICONS[cat.value]}</span>
                <span className="cat-chip__label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </DepthSection>

      <div className="strata-seam" />

      {/* Live prices */}
      <DepthSection className="section" depth={0.9}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">لحظه‌ای</span>
              <h2 className="section-title">جدول قیمت‌های بازار</h2>
            </div>
            <Link to="/prices" className="section-link">
              مشاهده جزئیات و نمودار ←
            </Link>
          </div>

          {!loading && prices.length === 0 && (
            <EmptyBlock title="هنوز قیمتی ثبت نشده" hint="به‌زودی قیمت‌ها اضافه خواهند شد." />
          )}

          {!loading && prices.length > 0 && (
            <>
              <div className="home-price-grid">
                {pickOrderedPrices(prices, HOME_MAIN_PRICE_KEYS).map((item) => {
                  const change = priceChangePercent(item)
                  return (
                    <div key={item.id} className="home-price-card">
                      <span className="home-price-card__label">{item.label_fa}</span>
                      <span className="home-price-card__value">{formatPriceValue(item)}</span>
                      {change != null && (
                        <span
                          className={
                            'home-price-card__change ' +
                            (change >= 0 ? 'home-price-card__change--up' : 'home-price-card__change--down')
                          }
                        >
                          {change >= 0 ? '+' : ''}
                          {change}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <h3 className="home-price-grid__subtitle">فلزات پایه و گران‌بها</h3>
              <div className="home-price-grid">
                {pickOrderedPrices(prices, HOME_METAL_PRICE_KEYS).map((item) => {
                  const change = priceChangePercent(item)
                  return (
                    <div key={item.id} className="home-price-card">
                      <span className="home-price-card__label">{item.label_fa}</span>
                      <span className="home-price-card__value">{formatPriceValue(item)}</span>
                      {change != null && (
                        <span
                          className={
                            'home-price-card__change ' +
                            (change >= 0 ? 'home-price-card__change--up' : 'home-price-card__change--down')
                          }
                        >
                          {change >= 0 ? '+' : ''}
                          {change}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </DepthSection>

      <div className="strata-seam" />

      {/* Latest tender ads */}
      <DepthSection className="section section--alt" depth={1}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">تازه‌ترین</span>
              <h2 className="section-title">آگهی‌های تازه</h2>
            </div>
            <Link to="/ads" className="section-link">
              مشاهده همه ←
            </Link>
          </div>

          {loading && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
          {error && <ErrorBlock message="دریافت آگهی‌ها با خطا مواجه شد." />}
          {!loading && !error && featuredAds.length === 0 && (
            <EmptyBlock title="هنوز آگهی‌ای ثبت نشده" hint="به‌زودی آگهی‌های جدید اضافه خواهند شد." />
          )}
          {!loading && !error && featuredAds.length > 0 && (
            <div className="ad-grid">
              {featuredAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </div>
      </DepthSection>

      <div className="strata-seam" />

      {/* Contact section */}
      <DepthSection className="section section--alt" depth={1.2}>
        <div className="container contact-cta">
          <div>
            <h2 className="section-title">آگهی شما را در دیجی‌معدن منتشر می‌کنیم</h2>
            <p className="contact-cta__desc">
              برای ثبت آگهی معدن، ماده معدنی، درخواست مشارکت یا معرفی
              خدمات معدن‌کاری خود، همین حالا آگهی خود را ثبت کنید.
            </p>
          </div>
          <Link to="/submit-ad" className="btn btn-dark">
            ثبت آگهی
          </Link>
        </div>
      </DepthSection>
    </>
  )
}
