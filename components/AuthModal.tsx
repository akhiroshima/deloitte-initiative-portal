import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { typography } from '../tokens/typography';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Briefcase, XCircle, X, Clock } from 'lucide-react';
import { AVAILABLE_LOCATIONS, IS_DEV_MODE } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    name: '',
    role: 'Developer' as 'Designer' | 'Developer' | 'Lead' | 'Manager',
    location: '',
    skills: [] as string[],
    weeklyCapacityHrs: 40
  });

  // Dev registration form state (simplified)
  const [devRegisterData, setDevRegisterData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        // More specific error messages
        if (response.status === 401) {
          setError('Invalid username or password. Please check your credentials.');
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
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: registerData.username,
          name: registerData.name,
          role: registerData.role,
          location: registerData.location,
          skills: registerData.skills,
          weeklyCapacityHrs: registerData.weeklyCapacityHrs
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message and switch to login mode
        setError(null);
        setMode('login');
        // Pre-fill username for login
        setLoginData({ ...loginData, username: registerData.username });
        // Show success message
        alert(data.message || 'Registration successful! Please check your email for login credentials.');
      } else {
        // More specific error messages for registration
        if (response.status === 409) {
          setError('Username already exists. Please choose a different username.');
        } else if (response.status === 400) {
          setError('Invalid input. Please check all fields and try again.');
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

  const handleDevRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/auth-register-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(devRegisterData)
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message and switch to login mode
        setError(null);
        setMode('login');
        // Pre-fill username for login (extract from email)
        const username = devRegisterData.email.split('@')[0];
        setLoginData({ ...loginData, username: username });
        // Show success message
        alert(data.message || 'Dev registration successful! You can now login with your email and password.');
      } else {
        // More specific error messages for dev registration
        if (response.status === 409) {
          setError('Email already exists. Please use a different email.');
        } else if (response.status === 400) {
          setError('Invalid input. Please check your email and password.');
        } else if (response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Dev registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ username: '', password: '' });
    setRegisterData({
      username: '',
      name: '',
      role: 'Developer',
      location: '',
      skills: [],
      weeklyCapacityHrs: 40
    });
    setDevRegisterData({
      email: '',
      password: ''
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
              Register
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
                <label htmlFor="login-username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="pl-10 pr-3"
                    placeholder="your.username"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Login with your Deloitte username</p>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Dev Register Form */}
          {mode === 'register' && IS_DEV_MODE && (
            <form onSubmit={handleDevRegister} className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Development Mode</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Simplified registration for testing. Just enter your email and password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="dev-email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dev-email"
                    type="email"
                    value={devRegisterData.email}
                    onChange={(e) => setDevRegisterData({ ...devRegisterData, email: e.target.value })}
                    className="pl-10 pr-3"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="dev-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dev-password"
                    type={showPassword ? 'text' : 'password'}
                    value={devRegisterData.password}
                    onChange={(e) => setDevRegisterData({ ...devRegisterData, password: e.target.value })}
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
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Dev Account'}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && !IS_DEV_MODE && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="register-name" className="text-sm font-medium text-foreground">
                    Full Name
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-role" className="text-sm font-medium text-foreground">
                    Role
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <select
                      id="register-role"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as any })}
                      className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                      <option value="Lead">Lead</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="register-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="your.username"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Email will be:</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {registerData.username || 'username'}@deloitte.com
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-location" className="text-sm font-medium text-foreground">
                  Studio Location
                </label>
                <Select value={registerData.location} onValueChange={(value) => setRegisterData({ ...registerData, location: value })}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select your studio location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-skills" className="text-sm font-medium text-foreground">
                  Skills
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-skills"
                    type="text"
                    value={registerData.skills.join(', ')}
                    onChange={(e) => setRegisterData({ 
                      ...registerData, 
                      skills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
                    })}
                    className="pl-10"
                    placeholder="e.g. React, TypeScript, UI/UX Design"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enter your key skills separated by commas</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-capacity" className="text-sm font-medium text-foreground">
                  Weekly Capacity (Hours)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-capacity"
                    type="number"
                    min="1"
                    max="40"
                    value={registerData.weeklyCapacityHrs}
                    onChange={(e) => setRegisterData({ 
                      ...registerData, 
                      weeklyCapacityHrs: parseInt(e.target.value) || 1
                    })}
                    className="pl-10"
                    placeholder="40"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">How many hours per week can you dedicate to initiatives?</p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Password Information</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      A secure password will be automatically generated and sent to your email address. 
                      You'll be required to change it on your first login.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
