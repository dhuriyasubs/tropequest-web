'use client'

// Catches errors thrown by the root layout itself (app/error.jsx only
// covers errors below it). Must render its own <html>/<body> — styled
// inline since globals.css may not be mounted when this fires.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '1rem', textAlign: 'center',
        }}>
          <div style={{ maxWidth: '24rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a2e' }}>
              We&apos;re having trouble connecting
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Something went wrong loading TropeQuest. This is usually temporary — try again in a minute.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: '#c084a0', color: 'white', padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
