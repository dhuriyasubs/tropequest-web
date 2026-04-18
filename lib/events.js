function getSessionId() {
  if (typeof window === 'undefined') return null
  let id = sessionStorage.getItem('tq_sid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('tq_sid', id)
  }
  return id
}

function getDeviceId() {
  if (typeof window === 'undefined') return null
  let id = localStorage.getItem('tq_did')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tq_did', id)
  }
  return id
}

function getTrafficSource() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('tq_src')
  if (stored) return JSON.parse(stored)

  const params = new URLSearchParams(window.location.search)
  const utm_source = params.get('utm_source')
  const utm_medium = params.get('utm_medium')
  const utm_campaign = params.get('utm_campaign')
  const referrer_domain = document.referrer
    ? new URL(document.referrer).hostname
    : null

  const src = {
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    referrer_domain: referrer_domain || null,
  }
  localStorage.setItem('tq_src', JSON.stringify(src))
  return src
}

export function trackEvent(type, data = {}) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      session_id: getSessionId(),
      device_id: getDeviceId(),
      traffic_source: getTrafficSource(),
      referrer: document.referrer || null,
      data,
    }),
    keepalive: true,
  }).catch(() => {})
}
