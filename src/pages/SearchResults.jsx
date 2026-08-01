import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { globalSearch } from '../services/searchService'
import GlobalSearchBar from '../components/GlobalSearchBar'
import { LoadingBlock, EmptyBlock } from '../components/StatusBlocks'
import './SearchResults.css'

function groupResults(results) {
  const groups = {}
  for (const r of results) {
    if (!groups[r.result_type]) groups[r.result_type] = []
    groups[r.result_type].push(r)
  }
  return groups
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    globalSearch(query)
      .then((data) => mounted && setResults(data))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [query])

  const grouped = groupResults(results)

  return (
    <div className="container search-results-page">
      <h1 className="section-title">نتایج جست‌وجو</h1>
      <div className="search-results-page__bar">
        <GlobalSearchBar />
      </div>

      {loading && <LoadingBlock label="در حال جست‌وجو..." />}

      {!loading && query.trim() && results.length === 0 && (
        <EmptyBlock title={`چیزی برای «${query}» پیدا نشد`} hint="عبارت دیگری را امتحان کنید." />
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="search-results-page__count">
            {results.length.toLocaleString('fa-IR')} نتیجه برای «{query}»
          </p>
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} className="search-results-group">
              <h2 className="search-results-group__title">
                {type} <span>({items.length.toLocaleString('fa-IR')})</span>
              </h2>
              <div className="search-results-group__list">
                {items.map((item) => (
                  <Link key={type + item.ref_id} to={item.url} className="search-result-card">
                    <span className="search-result-card__title">{item.ref_title}</span>
                    {item.snippet && <span className="search-result-card__snippet">{item.snippet}</span>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
