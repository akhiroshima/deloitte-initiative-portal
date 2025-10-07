import type { Handler } from '@netlify/functions'

const testDeploymentHandler: Handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Deployment test successful',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }
}

export { testDeploymentHandler as handler }
