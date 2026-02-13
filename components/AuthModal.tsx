import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { typography } from '../tokens/typography';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Briefcase, XCircle, Clock } from 'lucide-react';
import { AVAILABLE_LOCATIONS } from '../constants';
import PasswordResetModal from './PasswordResetModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, session?: any) => void;
}

type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [loginData, setLoginData] = useState({ emailOrUsername: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Developer' as 'Designer' | 'Developer' | 'Lead' | 'Manager',
    location: '',
    skills: [] as string[],
    weeklyCapacityHrs: 40
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const isEmail = loginData.emailOrUsername.includes('@');
    const body = isEmail
      ? { email: loginData.emailOrUsername.trim(), password: loginData.password }
      : { username: loginData.emailOrUsername.trim(), password: loginData.password };

    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.user, data.session);
        onClose();
      } else {
        if (response.status === 401) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (response.status === 403) {
          setError('Access denied. Only @deloitte.com email addresses are allowed.');
        } else if (response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password
      };
      if (registerData.name.trim()) body.name = registerData.name.trim();
      if (registerData.role) body.role = registerData.role;
      if (registerData.location) body.location = registerData.location;
      if (registerData.skills.length) body.skills = registerData.skills;
      if (registerData.weeklyCapacityHrs) body.weeklyCapacityHrs = registerData.weeklyCapacityHrs;

      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setError(null);
        setMode('login');
        setLoginData((prev) => ({ ...prev, emailOrUsername: registerData.email.trim().toLowerCase() }));
        alert(data.message || 'Check your email to confirm your account before logging in.');
      } else {
        if (response.status === 409) {
          setError('An account with this email already exists. Try logging in or use a different email.');
        } else if (response.status === 400) {
          setError('Invalid input. Please check all fields and try again.');
        } else if (response.status === 403) {
          setError(data.error || 'Only @deloitte.com email addresses are allowed.');
        } else if (response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ emailOrUsername: '', password: '' });
    setRegisterData({
      email: '',
      password: '',
      name: '',
      role: 'Developer',
      location: '',
      skills: [],
      weeklyCapacityHrs: 40
    });
    setError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`${typography.h1}`}>
            {mode === 'login' ? 'Welcome Back' : 'Join Deloitte Initiative Portal'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Create your account to get started with initiatives'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <Button
              onClick={() => switchMode('login')}
              variant={mode === 'login' ? 'secondary' : 'ghost'}
              className="flex-1"
              size="sm"
            >
              Login
            </Button>
            <Button
              onClick={() => switchMode('register')}
              variant={mode === 'register' ? 'secondary' : 'ghost'}
              className="flex-1"
              size="sm"
            >
              Sign up
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium mb-2">{error}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setError(null)}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Dismiss
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setError(null);
                        resetForm();
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="login-email"
                    type="text"
                    autoComplete="email"
                    value={loginData.emailOrUsername}
                    onChange={(e) => setLoginData({ ...loginData, emailOrUsername: e.target.value })}
                    className="pl-10 pr-3"
                    placeholder="you@deloitte.com or username"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use your full email or username</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Sign up Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  Email <span className="text-muted-foreground">(must be @deloitte.com)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="pl-10 pr-3"
                    placeholder="you@deloitte.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pl-10 pr-10"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Choose a password (at least 8 characters)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="register-name" className="text-sm font-medium text-foreground">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="pl-10 pr-3"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-role" className="text-sm font-medium text-foreground">
                    Role <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Select value={registerData.role} onValueChange={(value) => setRegisterData({ ...registerData, role: value as typeof registerData.role })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-location" className="text-sm font-medium text-foreground">
                  Studio location <span className="text-muted-foreground">(optional)</span>
                </label>
                <Select value={registerData.location} onValueChange={(value) => setRegisterData({ ...registerData, location: value })}>
                  <SelectTrigger className="w-full">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-skills" className="text-sm font-medium text-foreground">
                  Skills <span className="text-muted-foreground">(optional, comma-separated)</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-skills"
                    type="text"
                    value={registerData.skills.join(', ')}
                    onChange={(e) => setRegisterData({
                      ...registerData,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })}
                    className="pl-10"
                    placeholder="e.g. React, TypeScript"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-capacity" className="text-sm font-medium text-foreground">
                  Weekly capacity (hours) <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-capacity"
                    type="number"
                    min={1}
                    max={40}
                    value={registerData.weeklyCapacityHrs}
                    onChange={(e) => setRegisterData({ ...registerData, weeklyCapacityHrs: parseInt(e.target.value, 10) || 40 })}
                    className="pl-10"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                After signing up, check your email to confirm your account. Then you can log in.
              </p>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
      <PasswordResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} />
    </Dialog>
  );
};

export default AuthModal;
