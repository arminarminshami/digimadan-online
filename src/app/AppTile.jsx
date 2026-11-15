import { Link } from 'react-router-dom'
import AppIcon from './AppIcons'

// کاشی آیکونی: هر بخش اپلیکیشن یک کاشی جدا است
export default function AppTile({ to, href, label, icon, color, hint, badge }) {
  const inner = (
    <>
      <span className="app-tile__icon">
        <AppIcon name={icon} size={26} stroke={1.7} />
        {badge > 0 && <span className="app-tile__badge">{badge > 99 ? '۹۹+' : Number(badge).toLocaleString('fa-IR')}</span>}
      </span>
      <span className="app-tile__label">{label}</span>
      {hint && <span className="app-tile__hint">{hint}</span>}
    </>
  )
  const style = { '--c': color }
  if (href) {
    return (
      <a href={href} className="app-tile" style={style} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <Link to={to} className="app-tile" style={style}>
      {inner}
    </Link>
  )
}
