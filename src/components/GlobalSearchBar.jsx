import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { globalSearch } from '../services/searchService'
import './GlobalSearchBar.css'

const MAX_PER_GROUP = 3

function groupResults(results) {
  const groups = {}
  for (const r of results) {
    if (!groups[r.result_type]) groups[r.result_type] = []
    groups[r.result_type].push(r)
  }
  return groups
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      globalSearch(query)
        .then((data) => {
          setResults(data)
          setOpen(true)
        })
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  function handleResultClick(url) {
    setOpen(false)
    navigate(url)
  }

  const grouped = groupResults(results)

  return (
    <div className="global-search" ref={wrapRef}>
      <form className="global-search__box" onSubmit={handleSubmit}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="جست‌وجو در آگهی‌ها، مواد معدنی، قیمت‌ها، مقالات و کل سایت..."
        />
        <button type="submit" className="btn btn-primary btn-sm">جست‌وجو</button>
      </form>

      {open && query.trim() && (
        <div className="global-search__dropdown">
          {loading && <p className="global-search__hint">در حال جست‌وجو...</p>}
          {!loading && results.length === 0 && (
            <p className="global-search__hint">چیزی برای «{query}» پیدا نشد.</p>
          )}
          {!loading &&
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="global-search__group">
                <span className="global-search__group-title">{type}</span>
                {items.slice(0, MAX_PER_GROUP).map((item) => (
                  <button
                    key={type + item.ref_id}
                    type="button"
                    className="global-search__result"
                    onClick={() => handleResultClick(item.url)}
                  >
                    <span className="global-search__result-title">{item.ref_title}</span>
                    {item.snippet && <span className="global-search__result-snippet">{item.snippet}</span>}
                  </button>
                ))}
              </div>
            ))}
          {!loading && results.length > 0 && (
            <Link
              to={`/search?q=${encodeURIComponent(query.trim())}`}
              className="global-search__see-all"
              onClick={() => setOpen(false)}
            >
              مشاهده همه نتایج برای «{query}» ←
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
