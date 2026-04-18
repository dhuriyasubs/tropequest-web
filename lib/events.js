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

export function trackEvent(type, data = {}) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, session_id: getSessionId(), device_id: getDeviceId(), data }),
    keepalive: true,
  }).catch(() => {})
}
