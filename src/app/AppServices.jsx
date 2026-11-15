import { CONTACT_INFO, buildWhatsAppLink } from '../lib/constants'
import AppTile from './AppTile'
import './AppHome.css'
import './AppServices.css'

const SECTIONS = [
  {
    title: 'بازار',
    tiles: [
      { to: '/ads', label: 'همه آگهی‌ها', icon: 'list', color: '#3E7CB1' },
      { to: '/auctions', label: 'مزایده‌ها', icon: 'gavel', color: '#B5483A' },
      { to: '/prices', label: 'قیمت‌های بازار', icon: 'chart', color: '#2E8B7A' },
      { to: '/minerals', label: 'مواد معدنی', icon: 'gem', color: '#C2703D' },
      { to: '/lab-equipment', label: 'تجهیزات آزمایشگاهی', icon: 'flask', color: '#8E5BB5' },
    ],
  },
  {
    title: 'اطلاعات',
    tiles: [
      { to: '/news', label: 'اخبار', icon: 'news', color: '#3A6EA5' },
      { to: '/articles', label: 'مقالات', icon: 'article', color: '#7A6A58' },
      { to: '/about', label: 'درباره ما', icon: 'info', color: '#5C7A52' },
    ],
  },
]

export default function AppServices() {
  const wa = buildWhatsAppLink(CONTACT_INFO.whatsappPhone, 'سلام، درباره دیجی‌معدن سوال دارم.')
  return (
    <div className="app-services">
      {SECTIONS.map((s) => (
        <section key={s.title} className="app-services__section">
          <h2 className="app-services__title">{s.title}</h2>
          <div className="app-services__grid">
            {s.tiles.map((t) => (
              <AppTile key={t.to} {...t} />
            ))}
          </div>
        </section>
      ))}

      <section className="app-services__section">
        <h2 className="app-services__title">پشتیبانی</h2>
        <div className="app-services__grid">
          <AppTile to="/contact" label="تماس با ما" icon="phone" color="#D9822B" />
          <AppTile href={wa} label="واتساپ" icon="whatsapp" color="#25A55F" />
          <AppTile href={`tel:${CONTACT_INFO.phones[0]}`} label="تماس تلفنی" icon="headset" color="#3E7CB1" />
        </div>
      </section>
    </div>
  )
}
