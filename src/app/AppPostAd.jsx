import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AD_CATEGORIES } from '../lib/constants'
import AppIcon from './AppIcons'
import './AppPostAd.css'

const TYPES = [
  {
    value: 'sell',
    icon: 'tag',
    color: '#C2703D',
    title: 'می‌خواهم بفروشم',
    text: 'ماده معدنی، معدن، ماشین‌آلات یا خدمات دارم و می‌خواهم برایش خریدار پیدا کنم.',
  },
  {
    value: 'buy',
    icon: 'cart',
    color: '#3E7CB1',
    title: 'می‌خواهم بخرم',
    text: 'دنبال ماده معدنی، معدن یا ماشین‌آلات هستم و می‌خواهم درخواست خرید ثبت کنم.',
  },
]

const CATEGORY_UI = {
  mineral_materials: {
    icon: 'gem',
    color: '#C2703D',
    hint: 'مثلاً نوع ماده معدنی، مقدار (تناژ)، عیار یا خلوص و قیمت را آماده داشته باشید.',
  },
  mines: {
    icon: 'mountain',
    color: '#7A6A58',
    hint: 'مثلاً استان و موقعیت معدن، نوع ماده و وضعیت مدارک و پروانه را آماده کنید.',
  },
  exploration_extraction: {
    icon: 'search',
    color: '#3E7CB1',
    hint: 'یک شرح کوتاه از پروژه یا خدمت اکتشاف و استخراج و استان مربوط را آماده کنید.',
  },
  partnership_investment: {
    icon: 'handshake',
    color: '#5C7A52',
    hint: 'شرح پروژه یا فرصت مشارکت و روش تماس را آماده کنید.',
  },
  mining_machinery: {
    icon: 'wrench',
    color: '#D9822B',
    hint: 'مثلاً نوع ماشین‌آلات، وضعیت و قیمت را آماده کنید.',
  },
}

const STEPS = ['نوع آگهی', 'دسته‌بندی', 'شروع ثبت']

export default function AppPostAd() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')

  const typeObj = TYPES.find((t) => t.value === type)
  const catLabel = AD_CATEGORIES.find((c) => c.value === category)?.label || ''
  const catUi = CATEGORY_UI[category]

  function next() {
    if (step === 1 && type) setStep(2)
    else if (step === 2 && category) setStep(3)
  }

  function start() {
    navigate(`/submit-ad?type=${type}&category=${category}`)
  }

  const canNext = (step === 1 && type) || (step === 2 && category)

  return (
    <div className="pa">
      <ol className="pa-steps" aria-label="مراحل">
        {STEPS.map((s, i) => (
          <li key={s} className={i + 1 === step ? 'is-active' : i + 1 < step ? 'is-done' : ''}>
            <span className="pa-steps__bar" />
            <span className="pa-steps__label">{s}</span>
          </li>
        ))}
      </ol>

      {/* حباب راهنما */}
      <div className="pa-bubble" key={step + type + category}>
        <span className="pa-bubble__icon">
          <AppIcon name={step === 3 ? 'check' : 'help'} size={20} />
        </span>
        <p>
          {step === 1 && 'اول مشخص کنید آگهی شما برای فروش است یا خرید. این انتخاب را بعداً هم می‌توانید در فرم عوض کنید.'}
          {step === 2 && !category && 'حالا دسته‌بندی آگهی را بزنید. هر دسته فرم مخصوص خودش را دارد.'}
          {step === 2 && category && catUi.hint}
          {step === 3 && 'همه‌چیز آماده است! فرم اصلی با همین انتخاب‌ها باز می‌شود و فقط باید مشخصات آگهی را وارد کنید.'}
        </p>
      </div>

      <div className="pa-stage" key={'stage' + step}>
        {step === 1 && (
          <div className="pa-types">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={'pa-type' + (type === t.value ? ' is-selected' : '')}
                style={{ '--c': t.color }}
                onClick={() => setType(t.value)}
              >
                <span className="pa-type__icon"><AppIcon name={t.icon} size={32} stroke={1.7} /></span>
                <b>{t.title}</b>
                <small>{t.text}</small>
                <span className="pa-type__tick"><AppIcon name="check" size={16} stroke={2.6} /></span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="pa-cats">
            {AD_CATEGORIES.map((c) => {
              const ui = CATEGORY_UI[c.value] || { icon: 'tag', color: '#C2703D' }
              return (
                <button
                  key={c.value}
                  type="button"
                  className={'pa-cat' + (category === c.value ? ' is-selected' : '')}
                  style={{ '--c': ui.color }}
                  onClick={() => setCategory(c.value)}
                >
                  <span className="pa-cat__icon"><AppIcon name={ui.icon} size={26} stroke={1.7} /></span>
                  <span className="pa-cat__label">{c.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div className="pa-summary">
            <div className="pa-summary__card">
              <div className="pa-summary__row">
                <span className="pa-summary__icon" style={{ '--c': typeObj.color }}>
                  <AppIcon name={typeObj.icon} size={22} />
                </span>
                <div>
                  <small>نوع آگهی</small>
                  <b>{type === 'sell' ? 'آگهی فروش' : 'آگهی خرید'}</b>
                </div>
              </div>
              <div className="pa-summary__row">
                <span className="pa-summary__icon" style={{ '--c': catUi.color }}>
                  <AppIcon name={catUi.icon} size={22} />
                </span>
                <div>
                  <small>دسته‌بندی</small>
                  <b>{catLabel}</b>
                </div>
              </div>
            </div>
            <ul className="pa-summary__list">
              <li><AppIcon name="check" size={16} stroke={2.4} /> برای ثبت آگهی باید وارد حساب شوید و اطلاعات پروفایل‌تان کامل باشد</li>
              <li><AppIcon name="check" size={16} stroke={2.4} /> ثبت آگهی رایگان است</li>
              <li><AppIcon name="check" size={16} stroke={2.4} /> آگهی بعد از تأیید ادمین روی سایت منتشر می‌شود</li>
            </ul>
          </div>
        )}
      </div>

      <div className="pa-actions">
        {step > 1 && (
          <button type="button" className="pa-btn pa-btn--ghost" onClick={() => setStep(step - 1)}>
            قبلی
          </button>
        )}
        {step < 3 ? (
          <button type="button" className="pa-btn pa-btn--primary" onClick={next} disabled={!canNext}>
            ادامه
          </button>
        ) : (
          <button type="button" className="pa-btn pa-btn--primary" onClick={start}>
            شروع ثبت آگهی
          </button>
        )}
      </div>
    </div>
  )
}
