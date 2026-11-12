import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPageBySlug } from '../services/pagesService'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import './ContentPage.css'

export default function ContentPage({ slug: slugProp, fallbackTitle, fallbackContent }) {
  const { slug: slugParam } = useParams()
  const slug = slugProp || slugParam
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getPageBySlug(slug)
      .then((data) => mounted && setPage(data))
      .catch((err) => mounted && setError('بارگذاری این صفحه با خطا مواجه شد. لطفاً دوباره تلاش کنید.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [slug])

  return (
    <div className="container content-page">
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message="بارگذاری این صفحه با خطا مواجه شد." />}
      {!loading && !error && !page && fallbackContent && (
        <article>
          <h1 className="content-page__title">{fallbackTitle}</h1>
          <div className="strata-line strata-line--thin" style={{ margin: '14px 0 28px', maxWidth: 160 }} />
          <div className="content-page__body">{fallbackContent}</div>
        </article>
      )}
      {!loading && !error && !page && !fallbackContent && (
        <EmptyBlock
          title={fallbackTitle || 'این صفحه هنوز تکمیل نشده'}
          hint="محتوای این صفحه به‌زودی از پنل مدیریت اضافه می‌شود."
        />
      )}
      {!loading && !error && page && (
        <article>
          <h1 className="content-page__title">{page.title}</h1>
          <div className="strata-line strata-line--thin" style={{ margin: '14px 0 28px', maxWidth: 160 }} />
          <div className="content-page__body">{page.content}</div>
        </article>
      )}
    </div>
  )
}
