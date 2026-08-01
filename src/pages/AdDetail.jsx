import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { getAdById } from '../services/adsService'
import { incrementViews } from '../services/auctionsService'
import { getOrCreateThread } from '../services/chatService'
import { LoadingBlock, ErrorBlock } from '../components/StatusBlocks'
import ProductSaleCard from '../components/ProductSaleCard'
import { AD_CATEGORY_MAP, AD_STATUS_LABELS, AD_TYPE_MAP, MINE_LICENSE_STATUS, MACHINE_CONDITIONS, SIMPLE_AD_CATEGORIES, buildWhatsAppLink } from '../lib/constants'
import { useSeo, buildAdJsonLd } from '../lib/useSeo'
import './AdDetail.css'

const MINERAL_FORM_LABELS = {
  lump: 'کلوخه',
  rock: 'سنگی',
  powder: 'پودری',
  soil: 'خاکی',
  granulated: 'دانه‌بندی‌شده',
  other: 'سایر',
}

export default function AdDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getAdById(id)
      .then((data) => {
        if (!mounted) return
        setAd(data)
        incrementViews(id)
      })
      .catch((err) => mounted && setError('بارگذاری آگهی با خطا مواجه شد. لطفاً دوباره تلاش کنید.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [id])

  // متن توضیحات برای موتورهای جست‌وجو (بدون شکستن قواعد هوک‌ها: قبل از return زودهنگام)
  useSeo({
    title: ad?.title,
    description: ad
      ? `${ad.mineral_type ? ad.mineral_type + ' — ' : ''}${(ad.description || '').slice(0, 150)}`
      : undefined,
    image: ad?.images?.[0],
    path: ad ? `/ads/${ad.id}` : undefined,
    jsonLd: buildAdJsonLd(ad),
  })

  if (loading) return <LoadingBlock label="در حال بارگذاری آگهی..." />
  if (error) return <ErrorBlock message="این آگهی یافت نشد یا حذف شده است." />
  if (!ad) return null

  async function handleMessageSeller() {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/ads/${id}` } })
      return
    }
    const thread = await getOrCreateThread({ adId: ad.id, buyerUserId: user.id, sellerUserId: ad.owner_user_id })
    navigate(`/dashboard?tab=messages&thread=${thread.id}`)
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : []
  const isArchived = ad.is_archived || ad.status === 'archived' || ad.status === 'sold'

  return (
    <div className="container ad-detail">
      <Link to="/ads" className="ad-detail__back">→ بازگشت به آگهی‌ها</Link>

      <div className="ad-detail__grid">
        <div className="ad-detail__main">
          <div className="ad-detail__gallery">
            <div className="ad-detail__main-image">
              {images.length > 0 ? (
                <img src={images[activeImage]} alt={ad.title} />
              ) : (
                <div className="ad-detail__no-image">بدون تصویر</div>
              )}
              {isArchived && <div className="ad-detail__sold-stamp">فروخته شد</div>}
            </div>
            {images.length > 1 && (
              <div className="ad-detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img}
                    className={
                      'ad-detail__thumb' + (i === activeImage ? ' ad-detail__thumb--active' : '')
                    }
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt={`تصویر ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ad-detail__info">
            <div className="ad-detail__badges">
              <span className={'ad-detail__type-badge' + (ad.ad_type === 'buy' ? ' ad-detail__type-badge--buy' : '')}>
                {AD_TYPE_MAP[ad.ad_type] || 'آگهی فروش'}
              </span>
              <span className="ad-detail__category">{AD_CATEGORY_MAP[ad.category] || ad.category}</span>
              {ad.status !== 'published' && (
                <span className="ad-detail__status-badge">{AD_STATUS_LABELS[ad.status] || ad.status}</span>
              )}
            </div>
            <h1 className="ad-detail__title">{ad.title}</h1>

            <div className="ad-detail__meta">
              <div className="ad-detail__meta-item">
                <span className="ad-detail__meta-label">استان</span>
                <span>{ad.province}</span>
              </div>

              {/* ---- معدن ---- */}
              {ad.mine_name && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">نام معدن</span>
                  <span>{ad.mine_name}</span>
                </div>
              )}
              {ad.mine_license_status && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">وضعیت پروانه</span>
                  <span>{MINE_LICENSE_STATUS.find((s) => s.value === ad.mine_license_status)?.label || ad.mine_license_status}</span>
                </div>
              )}
              {ad.mine_license_number && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">شماره پروانه</span>
                  <span>{ad.mine_license_number}</span>
                </div>
              )}
              {ad.mine_area_hectares != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">مساحت محدوده</span>
                  <span>{Number(ad.mine_area_hectares).toLocaleString('fa-IR')} هکتار</span>
                </div>
              )}
              {ad.mine_reserve_tons != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">ذخیره تخمینی</span>
                  <span>{Number(ad.mine_reserve_tons).toLocaleString('fa-IR')} تن</span>
                </div>
              )}

              {/* ---- ماشین‌آلات ---- */}
              {ad.machine_type && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">نوع ماشین‌آلات</span>
                  <span>{ad.machine_type}</span>
                </div>
              )}
              {ad.machine_brand && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">برند/سازنده</span>
                  <span>{ad.machine_brand}</span>
                </div>
              )}
              {ad.machine_model && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">مدل</span>
                  <span>{ad.machine_model}</span>
                </div>
              )}
              {ad.machine_year != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">سال ساخت</span>
                  <span>{ad.machine_year}</span>
                </div>
              )}
              {ad.machine_condition && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">وضعیت</span>
                  <span>{MACHINE_CONDITIONS.find((c) => c.value === ad.machine_condition)?.label || ad.machine_condition}</span>
                </div>
              )}
              {ad.machine_working_hours != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">ساعت کارکرد</span>
                  <span>{Number(ad.machine_working_hours).toLocaleString('fa-IR')}</span>
                </div>
              )}

              {/* ---- مواد معدنی ---- */}
              {ad.mineral_type && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">{ad.category === 'mines' ? 'ماده معدنی اصلی' : 'نوع ماده معدنی'}</span>
                  <span>{ad.mineral_type}</span>
                </div>
              )}
              {ad.mineral_form && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">شکل ماده</span>
                  <span>{MINERAL_FORM_LABELS[ad.mineral_form] || ad.mineral_form}</span>
                </div>
              )}
              {ad.tonnage != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">
                    {ad.ad_type === 'buy' ? 'تناژ مورد نیاز' : 'تناژ بار موجود (دپو)'}
                  </span>
                  <span>{Number(ad.tonnage).toLocaleString('fa-IR')} تن</span>
                </div>
              )}
              {ad.purity_percent != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">درصد خلوص</span>
                  <span>٪{ad.purity_percent}</span>
                </div>
              )}
              {ad.ore_grade && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">عیار</span>
                  <span>{ad.ore_grade}</span>
                </div>
              )}
              {ad.humidity_percent != null && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">رطوبت</span>
                  <span>٪{ad.humidity_percent}</span>
                </div>
              )}
              {ad.granularity && (
                <div className="ad-detail__meta-item">
                  <span className="ad-detail__meta-label">دانه‌بندی</span>
                  <span>{ad.granularity}</span>
                </div>
              )}
              <div className="ad-detail__meta-item">
                <span className="ad-detail__meta-label">بازدید</span>
                <span>{ad.views_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="ad-detail__description">
            <h2>توضیحات کامل</h2>
            <p>{ad.description}</p>
          </div>

          {ad.mine_documents && ad.mine_documents.length > 0 && (
            <div className="ad-detail__analysis">
              <h2>مدارک معدن</h2>
              <div className="ad-detail__doc-grid">
                {ad.mine_documents.map((doc, i) => (
                  <a key={doc} href={doc} target="_blank" rel="noreferrer" className="ad-detail__doc-thumb">
                    <img src={doc} alt={`مدرک ${i + 1}`} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {ad.analysis_file_url && (
            <div className="ad-detail__analysis">
              <h2>فایل آنالیز</h2>
              <a href={ad.analysis_file_url} target="_blank" rel="noreferrer" className="ad-detail__analysis-link">
                📎 مشاهده / دانلود فایل آنالیز
              </a>
            </div>
          )}
        </div>

        <aside className="ad-detail__side">
          {!SIMPLE_AD_CATEGORIES.includes(ad.category) && <ProductSaleCard ad={ad} />}

          {!isArchived && ad.phone && (
            <div className="ad-detail__contact-box">
              <h3>اطلاعات تماس</h3>
              {ad.contact_name && <p className="ad-detail__contact-name">{ad.contact_name}</p>}
              <a href={`tel:${ad.phone}`} className="btn btn-primary btn-block">
                {ad.phone}
              </a>
              {ad.secondary_phone && (
                <a href={`tel:${ad.secondary_phone}`} className="btn btn-outline btn-block">
                  {ad.secondary_phone} (شماره دوم)
                </a>
              )}
              <a
                href={buildWhatsAppLink(ad.phone, `سلام، در مورد آگهی «${ad.title}» در دیجی‌معدن سوال داشتم.`)}
                target="_blank"
                rel="noreferrer"
                className="ad-detail__whatsapp-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9 1-.9 2.3 0 1.3.9 2.6 1.1 2.8.2.2 1.7 2.6 4.2 3.6 2.1.8 2.5.7 3 .6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2 0-.1-.1-.2-.4-.4z" />
                  <path d="M20.5 3.5A11 11 0 0 0 3.6 17.4L2 22l4.7-1.5A11 11 0 1 0 20.5 3.5zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1 1 1-3-.2-.3A9 9 0 1 1 12 21.5z" />
                </svg>
                پیام در واتساپ
              </a>
              {ad.owner_user_id && ad.owner_user_id !== user?.id && (
                <button type="button" className="btn btn-outline btn-block" onClick={handleMessageSeller}>
                  ارسال پیام در سایت
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
