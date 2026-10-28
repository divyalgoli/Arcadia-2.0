'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    // Redirect to the static Arcadia game hub
    window.location.href = '/index.html'
  }, [])

  return (
    <main style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#071323',
      color: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Loading Arcadia...
        </div>
        <div style={{ animation: 'spin 2s linear infinite' }} className="spinner" />
      </div>
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #00d4ff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
