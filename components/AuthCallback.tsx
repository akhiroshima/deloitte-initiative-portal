import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

/**
 * Handles redirect from Supabase after email confirmation (or magic link).
 * Supabase client with detectSessionInUrl will parse the hash and set the session.
 * We sync that session to cookies via auth-set-cookies, then redirect to /.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;

      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!session) {
        setError('Could not complete sign in. Please try logging in again.');
        return;
      }

      const res = await fetch('/.netlify/functions/auth-set-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
      if (!res.ok && !cancelled) {
        setError('Could not complete sign in. Please try again.');
        return;
      }
      if (!cancelled) navigate('/', { replace: true });
    }

    run();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-destructive mb-4">{error}</p>
          <button
            type="button"
            className="text-primary underline"
            onClick={() => navigate('/', { replace: true })}
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
