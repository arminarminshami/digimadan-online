import './ProductSaleCard.css'

function formatToman(value) {
  if (value == null) return null
  return Number(value).toLocaleString('fa-IR') + ' تومان'
}

export default function ProductSaleCard({ ad }) {
  const isSold = ad.status === 'sold' || ad.status === 'archived'
  const isBuy = ad.ad_type === 'buy'
  const price = formatToman(ad.base_price)

  return (
    <div className="product-sale-card">
      <div className="product-sale-card__price-row">
        <span className="product-sale-card__price-label">
          {isSold ? 'قیمت فروخته‌شده' : isBuy ? 'قیمت پیشنهادی خرید' : 'قیمت محصول'}
        </span>
        <span className="product-sale-card__price-value">{price || 'توافقی'}</span>
        {ad.tonnage != null && (
          <span className="product-sale-card__price-unit">
            به ازای هر تن · {isBuy ? 'تناژ مورد نیاز' : 'تناژ موجود'}: {Number(ad.tonnage).toLocaleString('fa-IR')} تن
          </span>
        )}
      </div>

      {ad.delivery_terms && (
        <div className="product-sale-card__row">
          <span className="product-sale-card__row-label">{isBuy ? 'شرایط دریافت بار' : 'شرایط تحویل بار'}</span>
          <span className="product-sale-card__row-value">{ad.delivery_terms}</span>
        </div>
      )}

      {isSold && <p className="product-sale-card__note">این محصول دیگر در دسترس نیست.</p>}
    </div>
  )
}
