export const initAnalytics = () => {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!id) return
  if (document.getElementById('ga-init')) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)
  const inline = document.createElement('script')
  inline.id = 'ga-init'
  inline.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${id}');`
  document.head.appendChild(inline)
}

export const trackEvent = (action: string, params: Record<string, any> = {}) => {
  // @ts-ignore
  if (typeof gtag === 'function') {
    // @ts-ignore
    gtag('event', action, params)
  }
}