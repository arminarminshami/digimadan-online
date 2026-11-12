import { Link } from 'react-router-dom'
import { AD_CATEGORY_MAP } from '../lib/constants'
import './AdCard.css'

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
      <rect width="400" height="280" fill="#EFEADC"/>
      <path d="M0 200L80 110L150 180L230 90L320 170L400 130V280H0Z" fill="#DDD6C7"/>
    </svg>`
  )

function formatToman(value) {
  return Number(value).toLocaleString('fa-IR') + ' تومان'
}

export default function AdCard({ ad }) {
  const cover = ad.images?.[0] || PLACEHOLDER_IMG
  const categoryLabel = AD_CATEGORY_MAP[ad.category] || ad.category
  const isSold = ad.status === 'sold' || ad.status === 'archived'
  const hasPrice = ad.base_price != null
  const isBuy = ad.ad_type === 'buy'

  return (
    <Link to={`/ads/${ad.id}`} className="ad-card">
      <div className="ad-card__image-wrap">
        <img src={cover} alt={ad.title} loading="lazy" />
        <span className="ad-card__category">{categoryLabel}</span>
        <span className={'ad-card__type-badge' + (isBuy ? ' ad-card__type-badge--buy' : '')}>
          {isBuy ? 'آگهی خرید' : 'آگهی فروش'}
        </span>
      </div>
      <div className="ad-card__body">
        <h3 className="ad-card__title">{ad.title}</h3>
        <div className="ad-card__province">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" />
            <circle cx="12" cy="9" r="2.4" />
          </svg>
          {ad.province}
        </div>
        {hasPrice && (
          <div className="ad-card__price-row">
            <span className="ad-card__price-label">
              {isSold ? 'فروخته شد' : isBuy ? 'قیمت پیشنهادی خرید' : 'قیمت محصول'}
            </span>
            <span className="ad-card__price-value">{formatToman(ad.base_price)}</span>
          </div>
        )}
        <span className="ad-card__cta">مشاهده جزئیات آگهی ←</span>
      </div>
    </Link>
  )
}

