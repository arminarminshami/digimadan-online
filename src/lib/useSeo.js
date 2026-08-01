import { useEffect } from 'react'

// آدرس اصلی سایت -- در Vercel به‌صورت متغیر محیطی VITE_SITE_URL تنظیم شود
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://digimadan.com').replace(/\/$/, '')
export const SITE_NAME = 'دیجی‌معدن'

function setMetaTag(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkTag(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const JSON_LD_ID = 'seo-json-ld'

function setJsonLd(data) {
  const existing = document.getElementById(JSON_LD_ID)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * تنظیم عنوان، توضیحات، canonical، Open Graph و داده‌ی ساختاریافته‌ی هر صفحه.
 *
 * نکته‌ی مهم: چون سایت به‌صورت SPA رندر می‌شود، این تگ‌ها بعد از اجرای
 * جاوااسکریپت به صفحه اضافه می‌شوند. گوگل جاوااسکریپت را اجرا می‌کند و
 * آن‌ها را می‌بیند، اما خزنده‌های هوش مصنوعی (GPTBot و...) که JS اجرا
 * نمی‌کنند فقط تگ‌های پیش‌فرض داخل index.html را می‌بینند.
 */
export function useSeo({ title, description, image, path, jsonLd, noIndex } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | آگهی‌های معدن و مواد معدنی`
    const url = path ? `${SITE_URL}${path}` : SITE_URL
    const img = image || `${SITE_URL}/logo.png`

    document.title = fullTitle
    setMetaTag('name', 'description', description)
    setLinkTag('canonical', url)

    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    setMetaTag('property', 'og:site_name', SITE_NAME)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:locale', 'fa_IR')
    setMetaTag('property', 'og:title', fullTitle)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:image', img)

    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', fullTitle)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', img)

    setJsonLd(jsonLd)

    return () => setJsonLd(null)
  }, [title, description, image, path, noIndex, JSON.stringify(jsonLd)])
}

// ---------------- سازنده‌های داده‌ی ساختاریافته (Schema.org) ----------------

export function buildAdJsonLd(ad) {
  if (!ad) return null
  const url = `${SITE_URL}/ads/${ad.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ad.title,
    description: (ad.description || '').slice(0, 500),
    image: ad.images?.length ? ad.images : [`${SITE_URL}/logo.png`],
    category: ad.mineral_type || undefined,
    url,
    ...(ad.base_price
      ? {
          offers: {
            '@type': 'Offer',
            price: Number(ad.base_price),
            priceCurrency: 'IRR',
            availability:
              ad.status === 'sold' || ad.is_archived
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
            url,
            ...(ad.province
              ? { areaServed: { '@type': 'Place', name: `${ad.province}، ایران` } }
              : {}),
          },
        }
      : {}),
    ...(ad.contact_name ? { seller: { '@type': 'Organization', name: ad.contact_name } } : {}),
  }
}

export function buildArticleJsonLd(article) {
  if (!article) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: (article.content || '').slice(0, 300),
    image: article.cover_image_url || `${SITE_URL}/logo.png`,
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: { '@type': 'Person', name: article.author_name || SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
  }
}

export function buildItemListJsonLd(ads, listName) {
  if (!ads?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: ads.length,
    itemListElement: ads.slice(0, 30).map((ad, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/ads/${ad.id}`,
      name: ad.title,
    })),
  }
}
