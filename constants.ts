// Dev mode detection
export const IS_DEV_MODE = process.env.NODE_ENV === 'development' ||
  process.env.NETLIFY_DEV === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.includes('deloitte-portal-dev'));

export const AVAILABLE_LOCATIONS = [
  'Bangalore',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Remote',
].sort();
