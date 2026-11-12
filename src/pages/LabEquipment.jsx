import { useEffect, useState } from 'react'
import { getPublicLab } from '../services/labEquipmentService'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import { useSeo, SITE_URL } from '../lib/useSeo'
import './LabEquipment.css'

function EquipmentCard({ item }) {
  const images = item.images || []
  const [active, setActive] = useState(0)
  const current = images[active]

  return (
    <article className="lab-device">
      <div className="lab-device__media">
        {current ? (
          <a href={current} target="_blank" rel="noreferrer" aria-label="مشاهده تصویر بزرگ">
            <img src={current} alt={item.title_fa} loading="lazy" />
          </a>
        ) : (
          <div className="lab-device__noimg">بدون تصویر</div>
        )}
        {images.length > 1 && (
          <div className="lab-device__thumbs">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={'lab-device__thumb' + (i === active ? ' lab-device__thumb--active' : '')}
                onClick={() => setActive(i)}
                aria-label={`تصویر ${i + 1}`}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="lab-device__body">
        {item.brand && <span className="lab-device__brand" dir="ltr">{item.brand}</span>}
        <h3 className="lab-device__title">{item.title_fa}</h3>
        {item.title_en && <div className="lab-device__en" dir="ltr">{item.title_en}</div>}
        {item.description && <p className="lab-device__desc">{item.description}</p>}
        {item.catalog_url && (
          <a href={item.catalog_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            مشاهده / دانلود کاتالوگ
          </a>
        )}
      </div>
    </article>
  )
}

export default function LabEquipment() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    getPublicLab()
      .then((d) => mounted && setData(d))
      .catch(() => mounted && setError(true))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const holding = data?.holding

  useSeo({
    title: 'تجهیزات آزمایشگاهی',
    description:
      'تجهیزات آزمایشگاهی و آنالیز مواد معدنی با همکاری هلدینگ شریف: اسپکترومتری، کروماتوگرافی، جذب اتمی و مواد مصرفی آزمایشگاهی.',
    path: '/lab-equipment',
    jsonLd: holding
      ? {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: holding.name_fa,
          alternateName: holding.name_en || undefined,
          url: holding.website || `${SITE_URL}/lab-equipment`,
          telephone: holding.phones?.[0],
          email: holding.email || undefined,
        }
      : undefined,
  })

  if (loading) return <div className="container section"><LoadingBlock label="در حال بارگذاری..." /></div>
  if (error) return <div className="container section"><ErrorBlock message="دریافت اطلاعات با خطا مواجه شد." /></div>
  if (!data) {
    return (
      <div className="container section">
        <EmptyBlock title="این بخش به‌زودی راه‌اندازی می‌شود" hint="اطلاعات تجهیزات آزمایشگاهی در حال تکمیل است." />
      </div>
    )
  }

  const { companies, equipment } = data

  return (
    <div className="lab-page">
      <section className="lab-hero">
        <div className="container lab-hero__inner">
          <div className="lab-hero__text">
            <span className="section-eyebrow">تجهیزات آزمایشگاهی</span>
            <h1 className="lab-hero__title">{holding.name_fa}</h1>
            {holding.slogan && <p className="lab-hero__slogan">{holding.slogan}</p>}
            {holding.description && <p className="lab-hero__desc">{holding.description}</p>}
            <div className="lab-hero__actions">
              {(holding.phones || []).map((p, i) => (
                <a key={p} href={`tel:${p}`} className={'btn btn-sm ' + (i === 0 ? 'btn-primary' : 'btn-outline')} dir="ltr">
                  📞 {p}
                </a>
              ))}
              {holding.website && (
                <a href={holding.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  وب‌سایت هلدینگ
                </a>
              )}
            </div>
          </div>
          {holding.logo_url && (
            <div className="lab-hero__logo">
              <img src={holding.logo_url} alt={holding.name_fa} />
            </div>
          )}
        </div>
      </section>

      {holding.partnership_text && (
        <div className="container">
          <div className="lab-partner">
            <img src="/logo.png" alt="دیجی‌معدن" />
            <span className="lab-partner__x">×</span>
            {holding.logo_url && <img src={holding.logo_url} alt={holding.name_fa} />}
            <p>{holding.partnership_text}</p>
          </div>
        </div>
      )}

      {(holding.activities || []).length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2 className="section-title">حوزه‌های فعالیت</h2></div>
            <ul className="lab-activities">
              {holding.activities.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </section>
      )}

      {(holding.after_sales || []).length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2 className="section-title">خدمات پس از فروش و گارانتی</h2></div>
            <ul className="lab-activities lab-activities--check">
              {holding.after_sales.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head"><h2 className="section-title">شرکت‌های زیرمجموعه</h2></div>
            <div className="lab-companies">
              {companies.map((c, i) => (
                <div key={c.id} className="lab-company">
                  <span className="lab-company__num">{(i + 1).toLocaleString('fa-IR')}</span>
                  <h3>{c.name_fa}</h3>
                  {c.description && <p>{c.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head"><h2 className="section-title">دستگاه‌ها و تجهیزات</h2></div>
          {equipment.length === 0 ? (
            <EmptyBlock title="هنوز دستگاهی ثبت نشده" hint="به‌زودی دستگاه‌ها و کاتالوگ‌ها اضافه می‌شوند." />
          ) : (
            <div className="lab-devices">
              {equipment.map((item) => <EquipmentCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </section>

      {(holding.brands || []).length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head"><h2 className="section-title">برندهای معتبر</h2></div>
            <div className="lab-brands">
              {holding.brands.map((b) => <span key={b} className="lab-brand" dir="ltr">{b}</span>)}
            </div>
          </div>
        </section>
      )}

      {(holding.documents || []).length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2 className="section-title">کاتالوگ‌ها و فایل‌های قابل دانلود</h2></div>
            <div className="lab-docs">
              {holding.documents.map((d) => (
                <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="lab-doc">
                  <span className="lab-doc__icon">PDF</span>
                  <span className="lab-doc__title">{d.title}</span>
                  <span className="lab-doc__cta">مشاهده / دانلود</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {(holding.brochure_images || []).length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2 className="section-title">بروشور معرفی هلدینگ</h2></div>
            <div className="lab-brochures">
              {holding.brochure_images.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt={`بروشور ${holding.name_fa} ${i + 1}`} loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--alt">
        <div className="container">
          <div className="section-head"><h2 className="section-title">تماس با {holding.name_fa}</h2></div>
          <div className="lab-contact">
            {(holding.addresses || []).map((a) => (
              <div key={a.title} className="lab-contact__card">
                <strong>{a.title}</strong>
                <p>{a.text}</p>
              </div>
            ))}
            <div className="lab-contact__card">
              <strong>راه‌های ارتباطی</strong>
              {(holding.phones || []).map((p) => (
                <a key={p} href={`tel:${p}`} dir="ltr">{p}</a>
              ))}
              {holding.email && <a href={`mailto:${holding.email}`} dir="ltr">{holding.email}</a>}
              {holding.website && <a href={holding.website} target="_blank" rel="noreferrer" dir="ltr">{holding.website.replace(/^https?:\/\//, '')}</a>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
