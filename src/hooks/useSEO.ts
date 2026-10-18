import { useEffect } from 'react'

type SEOParams = {
  title?: string
  description?: string
  keywords?: string[]
  url?: string
  image?: string
  type?: 'website' | 'article' | 'video' | 'profile'
  canonical?: string
  schema?: Record<string, any>
}

const setTag = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector(selector) as HTMLElement | null
  if (!el) {
    el = document.createElement(attrs['tag'] || 'meta')
    Object.keys(attrs).forEach(k => {
      if (k !== 'tag') el!.setAttribute(k, attrs[k])
    })
    document.head.appendChild(el)
  } else {
    Object.keys(attrs).forEach(k => {
      if (k !== 'tag') el!.setAttribute(k, attrs[k])
    })
  }
}

const setCanonical = (href: string) => {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

const setJsonLd = (schema: Record<string, any>) => {
  let script = document.head.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(schema)
}

export function useSEO(params: SEOParams) {
  useEffect(() => {
    const siteUrl = params.url || import.meta.env.VITE_SITE_URL || window.location.origin
    const pageUrl = params.canonical || `${siteUrl}${window.location.pathname}${window.location.search}`
    const title = params.title || document.title
    const description = params.description || ''
    const image = params.image || '/brand/admax-logo.png'
    const type = params.type || 'website'
    const keywords = params.keywords?.join(', ')

    if (title) document.title = title

    if (description) setTag('meta[name="description"]', { tag: 'meta', name: 'description', content: description })
    if (keywords) setTag('meta[name="keywords"]', { tag: 'meta', name: 'keywords', content: keywords })

    setTag('meta[property="og:title"]', { tag: 'meta', property: 'og:title', content: title })
    if (description) setTag('meta[property="og:description"]', { tag: 'meta', property: 'og:description', content: description })
    setTag('meta[property="og:type"]', { tag: 'meta', property: 'og:type', content: type })
    setTag('meta[property="og:url"]', { tag: 'meta', property: 'og:url', content: pageUrl })
    if (image) setTag('meta[property="og:image"]', { tag: 'meta', property: 'og:image', content: image })

    setTag('meta[name="twitter:card"]', { tag: 'meta', name: 'twitter:card', content: 'summary_large_image' })
    setTag('meta[name="twitter:title"]', { tag: 'meta', name: 'twitter:title', content: title })
    if (description) setTag('meta[name="twitter:description"]', { tag: 'meta', name: 'twitter:description', content: description })
    if (image) setTag('meta[name="twitter:image"]', { tag: 'meta', name: 'twitter:image', content: image })

    setCanonical(pageUrl)

    if (params.schema) setJsonLd(params.schema)

    const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
    if (verification) setTag('meta[name="google-site-verification"]', { tag: 'meta', name: 'google-site-verification', content: verification })
  }, [params.title, params.description, params.keywords, params.url, params.image, params.type, params.canonical, params.schema])
}

export default useSEO
