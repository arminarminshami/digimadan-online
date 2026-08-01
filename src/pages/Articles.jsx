import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublishedArticles } from '../services/articlesService'
import { LoadingBlock, EmptyBlock } from '../components/StatusBlocks'
import { useSeo } from '../lib/useSeo'
import './Articles.css'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublishedArticles().then(setArticles).finally(() => setLoading(false))
  }, [])

  useSeo({
    title: 'مقالات تخصصی معدن',
    description: 'مقالات آموزشی و تخصصی درباره اکتشاف، استخراج و فرآوری مواد معدنی در ایران.',
    path: '/articles',
  })

  if (loading) return <LoadingBlock label="در حال بارگذاری مقالات..." />

  return (
    <div className="container articles-page">
      <span className="section-eyebrow">مقالات</span>
      <h1 className="section-title">مقالات تخصصی معدن</h1>

      {articles.length === 0 ? (
        <EmptyBlock title="هنوز مقاله‌ای منتشر نشده" />
      ) : (
        <div className="articles-grid">
          {articles.map((a) => (
            <Link key={a.id} to={`/articles/${a.slug}`} className="article-card">
              {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} />}
              <div className="article-card__body">
                <h2>{a.title}</h2>
                <span className="article-card__meta">
                  {a.author_name ? `${a.author_name} · ` : ''}
                  {new Date(a.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
