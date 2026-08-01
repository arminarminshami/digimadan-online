import { useEffect, useState } from 'react'
import { getNewsItems } from '../services/articlesService'
import { LoadingBlock, EmptyBlock } from '../components/StatusBlocks'
import './News.css'

export default function News() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNewsItems().then(setItems).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock label="در حال بارگذاری اخبار..." />

  return (
    <div className="container news-page">
      <span className="section-eyebrow">اخبار</span>
      <h1 className="section-title">تازه‌ترین اخبار معدن</h1>

      {items.length === 0 ? (
        <EmptyBlock title="هنوز خبری ثبت نشده" hint="به‌زودی اخبار معدن اینجا منتشر می‌شود." />
      ) : (
        <div className="news-list">
          {items.map((n) => (
            <article key={n.id} className="news-item">
              <h2>{n.title}</h2>
              {n.summary && <p>{n.summary}</p>}
              <div className="news-item__meta">
                {n.source && <span>{n.source}</span>}
                <span>{new Date(n.published_at).toLocaleDateString('fa-IR')}</span>
                {n.source_url && (
                  <a href={n.source_url} target="_blank" rel="noreferrer">مطالعه کامل ←</a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
