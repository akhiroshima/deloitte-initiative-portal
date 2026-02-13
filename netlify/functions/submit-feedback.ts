import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { withSecurity } from './_lib/security';

interface FeedbackBody {
  id: string;
  timestamp?: string;
  message: string;
  screenshot?: string | null;
  url?: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

const submitHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: FeedbackBody = JSON.parse(event.body || '{}');
    if (!body.id || !body.message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: id, message' }),
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Database not configured' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('feedback').insert({
      id: body.id,
      message: body.message,
      url: body.url ?? null,
      user_agent: body.userAgent ?? null,
      viewport_width: body.viewport?.width ?? null,
      viewport_height: body.viewport?.height ?? null,
      screenshot_path: body.screenshot ? 'inline' : null, // optional: could store in object storage later
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to save feedback' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: body.id,
      }),
    };
  } catch (e) {
    console.error('Submit feedback error:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error',
      }),
    };
  }
};

export const handler = withSecurity(submitHandler);
