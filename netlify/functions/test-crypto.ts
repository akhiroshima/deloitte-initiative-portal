import type { Handler } from '@netlify/functions'

const testCryptoHandler: Handler = async (event) => {
  try {
    // Test if crypto.subtle is available
    const hasCryptoSubtle = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
    
    let hashResult = null
    let hashError = null
    
    if (hasCryptoSubtle) {
      try {
        const encoder = new TextEncoder()
        const data = encoder.encode('test-password')
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        hashResult = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (error) {
        hashError = error.message
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hasCryptoSubtle,
        hashResult: hashResult ? 'SUCCESS' : 'FAILED',
        hashError,
        nodeVersion: process.version,
        cryptoAvailable: typeof crypto !== 'undefined',
        subtleAvailable: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
      })
    }
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Test failed',
        details: e.message,
        stack: e.stack
      })
    }
  }
}

export { testCryptoHandler as handler }
