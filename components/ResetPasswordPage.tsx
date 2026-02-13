import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { typography } from '../tokens/typography';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Page users land on after clicking "Reset password" in the email.
 * URL hash contains access_token & type=recovery; Supabase client parses it and sets session.
 * User enters new password; we call updateUser, sync cookies, then redirect to /.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = location.hash || ''
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const type = params.get('type')
    const isRecovery = type === 'recovery'
    if (isRecovery) {
      setHasRecoverySession(true)
      return
    }
    const checkSession = async () => {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } }
      if (session) setHasRecoverySession(true)
      else setHasRecoverySession(false)
    }
    checkSession()
  }, [location.hash])

  useEffect(() => {
    if (hasRecoverySession === false) {
      navigate('/', { replace: true })
    }
  }, [hasRecoverySession, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!supabase) {
      setError('Unable to update password. Please try again.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message || 'Failed to update password.')
        setLoading(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/.netlify/functions/auth-set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })
      }
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (hasRecoverySession === null) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (hasRecoverySession === false) {
    return null
  }

  return (
    <div className="flex h-screen bg-background text-foreground items-center justify-center">
      <div className="w-full max-w-md px-4">
        <h1 className={`${typography.h1} mb-2`}>Set new password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your new password below. Use at least 8 characters.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-10"
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
        <p className="mt-4 text-center">
          <button
            type="button"
            className="text-primary underline text-sm"
            onClick={() => navigate('/', { replace: true })}
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  )
}
