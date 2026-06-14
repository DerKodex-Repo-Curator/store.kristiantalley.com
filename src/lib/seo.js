import { useEffect } from 'react'

/**
 * Lightweight per-route SEO for the SPA: updates document title, meta
 * description, Open Graph / Twitter tags, canonical link, and an optional
 * route-level JSON-LD block. No dependency (keeps the lean setup).
 *
 * Note: this runs client-side, so JS-capable crawlers (Google) see it. The
 * static identity in index.html covers non-JS crawlers.
 */
function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeo({ title, description, canonical, image, jsonLd } = {}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    if (title) {
      document.title = title
      upsertMeta('property', 'og:title', title)
      upsertMeta('name', 'twitter:title', title)
    }
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    if (canonical) {
      upsertLink('canonical', canonical)
      upsertMeta('property', 'og:url', canonical)
    }
    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    }

    const id = 'route-jsonld'
    let script = document.getElementById(id)
    if (jsonLdKey) {
      if (!script) {
        script = document.createElement('script')
        script.id = id
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = jsonLdKey
    } else if (script) {
      script.remove()
    }
  }, [title, description, canonical, image, jsonLdKey])
}
