import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  checkAuth: () => Promise<User | null>;
  login: (user: User, session?: { access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      setAuthLoading(true);
      const response = await fetch('/.netlify/functions/auth-me', { credentials: 'include' });
      if (!response.ok) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        api.setCurrentUserId(null);
        return null;
      }
      const data = await response.json();
      if (data.authenticated && data.user) {
        if (data.session && supabase) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        api.setCurrentUserId(data.user.id);
        return data.user;
      }
      setIsAuthenticated(false);
      setCurrentUser(null);
      api.setCurrentUserId(null);
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      api.setCurrentUserId(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (user: User, session?: { access_token: string; refresh_token: string }) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (session && supabase) {
      await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    }
    api.setCurrentUserId(user.id);
    setShowAuthModal(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/.netlify/functions/auth-logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    api.setCurrentUserId(null);
    setShowAuthModal(true);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated,
    authLoading,
    showAuthModal,
    setShowAuthModal,
    checkAuth,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
