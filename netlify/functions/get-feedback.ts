import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { withSecurity } from './_lib/security';

const getHandler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
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
    const { data: rows, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Feedback fetch error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to load feedback' }),
      };
    }

    const feedbacks = (rows || []).map((r: { id: string; message: string; url: string | null; user_agent: string | null; viewport_width: number | null; viewport_height: number | null; screenshot_path: string | null; created_at: string }) => ({
      id: r.id,
      timestamp: r.created_at,
      message: r.message,
      url: r.url ?? '',
      userAgent: r.user_agent ?? '',
      viewport: { width: r.viewport_width ?? 0, height: r.viewport_height ?? 0 },
      screenshotPath: r.screenshot_path,
    }));

    const format = event.queryStringParameters?.format || 'json';
    if (format === 'markdown') {
      const markdown = [
        '# Development Feedback Report',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        `**Total Feedbacks:** ${feedbacks.length}`,
        '',
        ...feedbacks.map(
          (f: { id: string; timestamp: string; message: string; url: string; viewport: { width: number; height: number } }) =>
            `## ${f.id}\n**Time:** ${f.timestamp}\n**URL:** ${f.url}\n**Viewport:** ${f.viewport.width} × ${f.viewport.height}\n\n${f.message}\n\n---\n`
        ),
      ].join('\n');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/markdown' },
        body: markdown,
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedbacks,
        lastUpdated: feedbacks[0]?.timestamp ?? new Date().toISOString(),
      }),
    };
  } catch (e) {
    console.error('Get feedback error:', e);
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

export const handler = withSecurity(getHandler);
