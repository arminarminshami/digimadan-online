import { Link } from 'react-router-dom'
import { CONTACT_INFO } from '../lib/constants'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="strata-line" />
      <div className="container site-footer__grid">
        <div className="site-footer__col">
          <Link to="/" className="site-footer__brand">
            <img src="/logo.png" alt="دیجی‌معدن" className="site-footer__brand-mark" />
            <span>دیجی‌معدن</span>
          </Link>
          <p className="site-footer__about">
            بستری برای انتشار آگهی‌های فروش معدن، مواد معدنی، درخواست مشارکت و
            خدمات معدن‌کاری در سراسر ایران.
          </p>
        </div>

        <div className="site-footer__col">
          <div className="site-footer__heading">دسترسی سریع</div>
          <Link to="/">خانه</Link>
          <Link to="/ads">آگهی‌ها</Link>
          <Link to="/about">درباره ما</Link>
          <Link to="/contact">تماس با ما</Link>
        </div>

        <div className="site-footer__col">
          <div className="site-footer__heading">دسته‌بندی‌ها</div>
          <Link to="/ads?category=mine_sale">فروش معدن</Link>
          <Link to="/ads?category=mineral_sale">فروش ماده معدنی</Link>
          <Link to="/ads?category=partnership">درخواست مشارکت</Link>
          <Link to="/ads?category=service">خدمات معدن‌کاری</Link>
        </div>

        <div className="site-footer__col">
          <div className="site-footer__heading">اطلاعات تماس</div>
          {CONTACT_INFO.phones.map((phone) => (
            <a key={phone} href={`tel:${phone}`} dir="ltr">
              {phone}
            </a>
          ))}
          <a href={`mailto:${CONTACT_INFO.email}`} dir="ltr">
            {CONTACT_INFO.email}
          </a>
          <span className="site-footer__address">{CONTACT_INFO.address}</span>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <span>© {year} دیجی‌معدن. تمامی حقوق محفوظ است.</span>
      </div>
    </footer>
  )
}
