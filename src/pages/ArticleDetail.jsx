import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArticleBySlug } from '../services/articlesService'
import { LoadingBlock, ErrorBlock } from '../components/StatusBlocks'
import { useSeo, buildArticleJsonLd } from '../lib/useSeo'
import './Articles.css'

export default function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticleBySlug(slug)
      .then(setArticle)
      .catch((err) => setError('بارگذاری مقاله با خطا مواجه شد. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }, [slug])

  useSeo({
    title: article?.title,
    description: article ? (article.content || '').slice(0, 155) : undefined,
    image: article?.cover_image_url,
    path: article ? `/articles/${article.slug}` : undefined,
    jsonLd: buildArticleJsonLd(article),
  })

  if (loading) return <LoadingBlock label="در حال بارگذاری مقاله..." />
  if (error || !article) return <ErrorBlock message="این مقاله یافت نشد." />

  return (
    <div className="container article-detail">
      <Link to="/articles" className="ad-detail__back">→ بازگشت به مقالات</Link>
      {article.cover_image_url && <img src={article.cover_image_url} alt={article.title} className="article-detail__cover" />}
      <h1>{article.title}</h1>
      <p className="article-detail__date">{new Date(article.created_at).toLocaleDateString('fa-IR')}</p>
      <div className="article-detail__body">{article.content}</div>
      <p className="article-detail__author">
        نویسنده: {article.author_name || 'تیم دیجی‌معدن'}
      </p>
    </div>
  )
}
