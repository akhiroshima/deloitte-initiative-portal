import type { Handler } from '@netlify/functions'

const debugSimpleHandler: Handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Simple function works',
      timestamp: new Date().toISOString()
    })
  }
}

export const handler = debugSimpleHandler
