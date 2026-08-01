import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyParticipations } from '../../services/auctionService'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import { formatJalaliDateTime } from '../../components/JalaliDateSelect'
import './DashboardAuctions.css'

const STATUS = {
  pending: { label: 'در انتظار تایید پلتفرم', cls: 'dash-auc__pill--pending' },
  approved: { label: 'تایید شده — شما در مزایده شرکت دارید', cls: 'dash-auc__pill--ok' },
  rejected: { label: 'تایید نشده', cls: 'dash-auc__pill--bad' },
}

export default function DashboardAuctions({ user }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    getMyParticipations(user.id)
      .then((d) => mounted && setRows(d))
      .catch(() => mounted && setError('بارگذاری مزایده‌های شما با خطا مواجه شد.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [user.id])

  if (loading) return <LoadingBlock label="در حال بارگذاری مزایده‌های شما..." />
  if (error) return <ErrorBlock message={error} />

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">مزایده‌های من</h2>
          <p className="submit-ad__subtitle">
            فهرست مزایده‌هایی که در آن‌ها درخواست شرکت ثبت کرده‌اید.
          </p>
        </div>
        <Link to="/auctions" className="btn btn-outline btn-sm">مشاهده مزایده‌ها</Link>
      </div>

      {rows.length === 0 ? (
        <EmptyBlock
          title="هنوز در مزایده‌ای شرکت نکرده‌اید"
          hint="از بخش مزایده، مزایده‌های در حال برگزاری را ببینید."
        />
      ) : (
        <div className="dash-auc__list">
          {rows.map((r) => {
            const a = r.auctions || {}
            const st = STATUS[r.status] || {}
            return (
              <div key={r.id} className="dash-auc__card">
                <div className="dash-auc__head">
                  <h3>{a.title || 'مزایده'}</h3>
                  <span className={'dash-auc__pill ' + (st.cls || '')}>{st.label || r.status}</span>
                </div>

                <dl className="dash-auc__meta">
                  <div>
                    <dt>تاریخ ثبت درخواست</dt>
                    <dd>{formatJalaliDateTime(r.created_at)}</dd>
                  </div>
                  {r.offered_price != null && (
                    <div>
                      <dt>قیمت پیشنهادی شما</dt>
                      <dd>{Number(r.offered_price).toLocaleString('fa-IR')} تومان</dd>
                    </div>
                  )}
                  {a.held_at_text && (
                    <div>
                      <dt>زمان برگزاری</dt>
                      <dd>{a.held_at_text}</dd>
                    </div>
                  )}
                  <div>
                    <dt>وضعیت پرداخت</dt>
                    <dd>{r.payment_status === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}</dd>
                  </div>
                </dl>

                {/* نتیجه‌ی اختصاصی این شرکت‌کننده */}
                {r.result && (
                  <div className="dash-auc__result">
                    <span className="dash-auc__label">نتیجه مزایده برای شما</span>
                    <p>{r.result}</p>
                  </div>
                )}

                {/* نتیجه‌ی کلی مزایده که ادمین اعلام کرده */}
                {a.result_text && (
                  <div className="dash-auc__result dash-auc__result--general">
                    <span className="dash-auc__label">اعلام نتیجه‌ی مزایده</span>
                    <p>{a.result_text}</p>
                  </div>
                )}

                {r.admin_note && (
                  <div className="dash-auc__note">
                    <span className="dash-auc__label">توضیحات پلتفرم</span>
                    <p>{r.admin_note}</p>
                  </div>
                )}

                {a.id && (
                  <Link to={`/auctions/${a.id}`} className="btn btn-outline btn-sm">
                    مشاهده‌ی مزایده
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
