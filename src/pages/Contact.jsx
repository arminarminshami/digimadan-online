import { useEffect, useState } from 'react'
import { getPageBySlug } from '../services/pagesService'
import { CONTACT_INFO, buildWhatsAppLink } from '../lib/constants'
import './Contact.css'

export default function Contact() {
  const [page, setPage] = useState(null)

  useEffect(() => {
    getPageBySlug('contact').then(setPage).catch(() => setPage(null))
  }, [])

  return (
    <div className="container contact-page">
      <span className="section-eyebrow">تماس با ما</span>
      <h1 className="section-title">می‌خواهید آگهی ثبت کنید یا سوالی دارید؟</h1>

      <div className="contact-page__grid">
        <div className="contact-page__info">
          {page?.content ? (
            <p className="contact-page__custom">{page.content}</p>
          ) : (
            <p className="contact-page__custom">
              برای ثبت آگهی، ویرایش اطلاعات، یا هرگونه پرسش درباره معدن و
              مواد معدنی، از راه‌های زیر با تیم دیجی‌معدن در ارتباط باشید.
            </p>
          )}

          <a
            href={buildWhatsAppLink(CONTACT_INFO.whatsappPhone, 'سلام، در مورد دیجی‌معدن سوال داشتم.')}
            target="_blank"
            rel="noreferrer"
            className="contact-page__whatsapp"
          >
            <span className="contact-page__whatsapp-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9 1-.9 2.3 0 1.3.9 2.6 1.1 2.8.2.2 1.7 2.6 4.2 3.6 2.1.8 2.5.7 3 .6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2 0-.1-.1-.2-.4-.4z" />
                <path d="M20.5 3.5A11 11 0 0 0 3.6 17.4L2 22l4.7-1.5A11 11 0 1 0 20.5 3.5zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1 1 1-3-.2-.3A9 9 0 1 1 12 21.5z" />
              </svg>
            </span>
            چت در واتساپ
          </a>

          <ul className="contact-page__list">
            <li>
              <span className="contact-page__list-label">شماره‌های تماس</span>
              <div className="contact-page__phones">
                {CONTACT_INFO.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone}`} dir="ltr">
                    {phone}
                  </a>
                ))}
              </div>
            </li>
            <li>
              <span className="contact-page__list-label">ایمیل</span>
              <a href={`mailto:${CONTACT_INFO.email}`} dir="ltr">
                {CONTACT_INFO.email}
              </a>
            </li>
            <li>
              <span className="contact-page__list-label">آدرس دفتر</span>
              <span>{CONTACT_INFO.address}</span>
            </li>
          </ul>
        </div>

        <div className="contact-page__card">
          <div className="strata-line" />
          <h3>چرا دیجی‌معدن؟</h3>
          <ul className="contact-page__bullets">
            <li>دسترسی مستقیم به مخاطبان صنعت معدن</li>
            <li>پوشش تمام استان‌های کشور</li>
            <li>پشتیبانی برای ثبت و ویرایش آگهی</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
