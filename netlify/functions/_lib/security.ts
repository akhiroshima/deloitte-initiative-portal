// Security headers and middleware for Netlify Functions

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-eval needed for Vite in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
};

export const addSecurityHeaders = (response: any) => {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders
    }
  };
};

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' // Replace with actual domain
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export const handleCors = (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  return null;
};

// Input sanitization
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Validate request body size
export const validateBodySize = (body: string, maxSize: number = 1024 * 1024): boolean => {
  return body.length <= maxSize;
};

// Validate content type
export const validateContentType = (contentType: string): boolean => {
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data'
  ];
  
  return allowedTypes.some(type => contentType.includes(type));
};

// Security middleware wrapper
export const withSecurity = (handler: any) => {
  return async (event: any) => {
    try {
      // Handle CORS
      const corsResponse = handleCors(event);
      if (corsResponse) {
        return addSecurityHeaders(corsResponse);
      }
      
      // Validate content type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
        const contentType = event.headers['content-type'] || '';
        if (!validateContentType(contentType)) {
          return addSecurityHeaders({
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid content type' })
          });
        }
        
        // Validate body size
        if (event.body && !validateBodySize(event.body)) {
          return addSecurityHeaders({
            statusCode: 413,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Request body too large' })
          });
        }
      }
      
      // Sanitize input
      if (event.body) {
        try {
          const parsedBody = JSON.parse(event.body);
          event.body = JSON.stringify(sanitizeInput(parsedBody));
        } catch (e) {
          // If JSON parsing fails, sanitize as string
          event.body = sanitizeInput(event.body);
        }
      }
      
      // Call the original handler
      const response = await handler(event);
      
      // Add security headers to response
      return addSecurityHeaders(response);
      
    } catch (error) {
      console.error('Security middleware error:', error);
      return addSecurityHeaders({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      });
    }
  };
};
