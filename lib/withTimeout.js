// Supabase's client has no built-in request timeout — on a free-tier outage
// (TCP CONNECT_TIMEOUT) an un-awaited query hangs until Vercel's own function
// timeout kills it, producing a raw platform Gateway Timeout instead of a
// page we control. Wrap any Supabase call with this so it fails fast into a
// normal thrown error that app/error.jsx can catch.
export function withTimeout(promise, ms = 6000, label = 'request') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    Promise.resolve(promise).then(
      value => { clearTimeout(timer); resolve(value) },
      err   => { clearTimeout(timer); reject(err) }
    )
  })
}
