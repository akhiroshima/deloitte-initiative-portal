import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Bulletin from './components/Bulletin';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';
import InitiativeDetail from './components/InitiativeDetail';
import UserProfile from './components/UserProfile';
import DocsPage from './components/DocsPage';
import OpportunitiesPage from './components/OpportunitiesPage';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import { OnboardingBanner } from './components/OnboardingBanner';
import { NetworkError } from './components/NetworkError';
import FeedbackButton from './components/FeedbackButton';
import * as api from './services/api';
import { supabase } from './services/supabase';
import { Initiative, User, HelpWanted, JoinRequest, Notification, Task } from './types';
import LoadingSkeleton from './components/ui/LoadingSkeleton';
import { LoadingTransition } from './components/ui/LoadingTransition';

type View = 'bulletin' | 'dashboard' | 'workspace' | 'docs' | 'opportunities';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('bulletin');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [detailPageTab, setDetailPageTab] = useState<'overview' | 'requests' | 'tasks'>('overview');
  // Auto-detect initial theme based on time of day, but allow manual switching
  const getInitialTheme = (): Theme => {
    const hour = new Date().getHours();
    // Dark mode between 6 PM (18:00) and 8 AM (08:00)
    return (hour >= 18 || hour < 8) ? 'dark' : 'light';
  };
  
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  
  // Lifted state
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [helpWanted, setHelpWanted] = useState<HelpWanted[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      setAuthLoading(true);
      console.log("Checking authentication...");
      const response = await fetch('/.netlify/functions/auth-me', {
        credentials: 'include'
      });
      
      // Handle non-200 responses
      if (!response.ok) {
        console.log("Auth check failed with status:", response.status);
        setIsAuthenticated(false);
        setCurrentUser(null);
        api.setCurrentUserId(null);
        return null;
      }
      
      const data = await response.json();
      console.log("Auth response:", data);
      
      if (data.authenticated && data.user) {
        console.log("User authenticated:", data.user.id);
        
        // Hydrate Supabase client if session is present
        if (data.session && supabase) {
          const { error } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          if (error) console.error("Failed to set Supabase session:", error);
        }

        setIsAuthenticated(true);
        setCurrentUser(data.user);
        // Sync with API layer
        api.setCurrentUserId(data.user.id);
        return data.user;
      } else {
        console.log("User not authenticated");
        setIsAuthenticated(false);
        setCurrentUser(null);
        api.setCurrentUserId(null);
        return null;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      api.setCurrentUserId(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Stable reference for handleDataChange to prevent re-renders
  const handleDataChangeRef = useRef<(user?: User) => Promise<void>>();
  const isMountedRef = useRef(true);
  
  handleDataChangeRef.current = async (user?: User) => {
    if (!isMountedRef.current) return; // Don't update state if component is unmounted
    
    const userToUse = user || currentUser;
    if (!userToUse?.id) {
      console.log("No user available for data loading");
      return;
    }
    
    // Prevent multiple simultaneous data loading calls
    if (isLoadingData) {
      console.log("Data loading already in progress, skipping...");
      return;
    }
    
    try {
      setIsLoadingData(true);
      setNetworkError(false);
      console.log("Loading data for user:", userToUse.id);
      const [initiativesData, helpWantedData, usersData, joinRequestsData, tasksData, notificationsData] = await Promise.all([
        api.getInitiatives(),
        api.getHelpWantedPosts(),
        api.getUsers(),
        api.getAllJoinRequests(),
        api.getAllTasks(),
        api.getNotificationsForUser(userToUse.id)
      ]);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setInitiatives(initiativesData);
      setHelpWanted(helpWantedData);
      setUsers(usersData);
      setJoinRequests(joinRequestsData);
      setTasks(tasksData);
      setNotifications(notificationsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      console.log("Data loaded successfully:", { 
        initiatives: initiativesData.length, 
        users: usersData.length 
      });

    } catch (error) {
      console.error("Failed to fetch app data:", error);
      if (isMountedRef.current) {
        setNetworkError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsLoadingData(false);
      }
    }
  };

  const handleDataChange = useCallback((user?: User) => {
    return handleDataChangeRef.current?.(user);
  }, []);

  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations
    
    const initializeApp = async () => {
      setLoading(true);
      const authenticatedUser = await checkAuth();
      if (authenticatedUser) {
        await handleDataChange(authenticatedUser);
      } else {
        setShowAuthModal(true);
        setLoading(false);
      }
      setIsInitialized(true);
    };
    
    initializeApp();
  }, []); // Empty dependency array - run only once on mount

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Authentication handlers
  const handleAuthSuccess = async (user: User, session?: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);

    if (session && supabase) {
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (error) console.error("Failed to set Supabase session:", error);
    }

    // Sync with API layer
    api.setCurrentUserId(user.id);
    setShowAuthModal(false);
    await handleDataChange(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/.netlify/functions/auth-logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Clear API layer sync
    api.setCurrentUserId(null);
    setShowAuthModal(true);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await handleDataChange();
    setIsRetrying(false);
  };
  
  const handleSetView = (view: View) => {
      setSelectedInitiativeId(null);
      setSelectedUserId(null);
      setActiveView(view);
  };

  const handleSelectUser = (userId: string) => {
    // If user clicks on themselves, go to their workspace instead of public profile
    if (currentUser && userId === currentUser.id) {
        handleSetView('workspace');
        return;
    }
    setSelectedInitiativeId(null);
    setSelectedUserId(userId);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.link.view === 'workspace') {
        handleSetView('workspace');
    } else {
        // Default navigation for most notifications
        setSelectedInitiativeId(notification.link.initiativeId);
        setDetailPageTab(notification.link.tab || 'overview');
        setActiveView('bulletin'); 
        setSelectedUserId(null);
    }

    // Update the notification state in the background if it's unread
    if (!notification.isRead) {
      // Optimistically update the UI
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      try {
        await api.markNotificationAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Revert on error
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notification.id ? { ...n, isRead: false } : n
          )
        );
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (currentUser) {
        const originalNotifications = [...notifications];
        const unreadCount = notifications.filter(n => !n.isRead).length;
        if (unreadCount === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            await api.markAllNotificationsAsRead(currentUser.id);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            // On error, revert to the original state.
            setNotifications(originalNotifications);
        }
    }
  };

  const handleSelectInitiative = (id: string, tab: 'overview' | 'requests' | 'tasks' = 'overview') => {
      setDetailPageTab(tab);
      setSelectedInitiativeId(id);
      setSelectedUserId(null);
  }

  const selectedInitiative = initiatives.find(i => i.id === selectedInitiativeId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Breadcrumb logic
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    
    if (selectedInitiativeId && selectedInitiative) {
      breadcrumbs.push({ label: 'Bulletin', onClick: () => handleSetView('bulletin') });
      breadcrumbs.push({ label: selectedInitiative.title, onClick: null });
    } else if (selectedUserId && selectedUser) {
      breadcrumbs.push({ label: 'Dashboard', onClick: () => handleSetView('dashboard') });
      breadcrumbs.push({ label: selectedUser.name, onClick: null });
    } else {
      switch (activeView) {
        case 'dashboard':
          breadcrumbs.push({ label: 'Dashboard', onClick: null });
          break;
        case 'workspace':
          breadcrumbs.push({ label: 'My Workspace', onClick: null });
          break;
        case 'docs':
          breadcrumbs.push({ label: 'Documentation', onClick: null });
          break;
        case 'opportunities':
          breadcrumbs.push({ label: 'Opportunities', onClick: null });
          break;
        case 'bulletin':
        default:
          breadcrumbs.push({ label: 'Bulletin', onClick: null });
          break;
      }
    }
    
    return breadcrumbs;
  };

  const getPageTitle = () => {
    if (selectedInitiativeId && selectedInitiative) {
      return selectedInitiative.title;
    } else if (selectedUserId && selectedUser) {
      return selectedUser.name;
    } else {
      switch (activeView) {
        case 'dashboard': return 'Dashboard';
        case 'workspace': return 'My Workspace';
        case 'docs': return 'Documentation';
        case 'opportunities': return 'Opportunities';
        case 'bulletin':
        default: return 'Bulletin';
      }
    }
  };

  const handleBack = () => {
    if (selectedInitiativeId) {
      setSelectedInitiativeId(null);
    } else if (selectedUserId) {
      setSelectedUserId(null);
    } else {
      // Default back behavior - go to bulletin
      handleSetView('bulletin');
    }
  };

  const renderView = () => {
    if (loading || !currentUser) {
        return <LoadingSkeleton type="page" />;
    }

    if (selectedUser) {
        return (
            <UserProfile
                user={selectedUser}
                allInitiatives={initiatives}
                onSelectInitiative={handleSelectInitiative}
                onBack={() => setSelectedUserId(null)}
                currentUser={currentUser}
                onDataChange={handleDataChange}
            />
        );
    }
      
    if (selectedInitiative) {
      return (
        <InitiativeDetail 
          initiative={selectedInitiative} 
          currentUser={currentUser}
          users={users}
          tasks={tasks.filter(t => t.initiativeId === selectedInitiative.id)}
          helpWanted={helpWanted}
          onBack={() => setSelectedInitiativeId(null)} 
          onDataChange={handleDataChange}
          onSelectUser={handleSelectUser}
          initialTab={detailPageTab}
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
                  initiatives={initiatives} 
                  users={users} 
                  tasks={tasks}
                  onSelectInitiative={handleSelectInitiative}
                  onSelectUser={handleSelectUser}
                />;
      case 'workspace':
        return (
            <Workspace
                currentUser={currentUser}
                initiatives={initiatives}
                joinRequests={joinRequests}
                tasks={tasks}
                onSelectInitiative={handleSelectInitiative}
                onDataChange={handleDataChange}
            />
        );
      case 'docs':
        return <DocsPage />;
      case 'opportunities':
        return <OpportunitiesPage 
                    helpWanted={helpWanted}
                    initiatives={initiatives}
                    currentUser={currentUser}
                    onDataChange={handleDataChange}
                    onSelectInitiative={handleSelectInitiative}
                />;
      case 'bulletin':
      default:
        return (
          <Bulletin 
            initiatives={initiatives}
            currentUser={currentUser}
            users={users}
            onSelectInitiative={handleSelectInitiative} 
            onDataChange={handleDataChange}
            onSelectUser={handleSelectUser}
          />
        );
    }
  };
  
  const viewKey = activeView + (selectedInitiativeId || '') + (selectedUserId || '');

  // Show loading screen while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? 'Checking authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar 
          activeView={activeView} 
          setActiveView={handleSetView} 
          isPinned={isSidebarPinned}
          onTogglePin={() => setIsSidebarPinned(p => !p)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header 
              currentUser={currentUser}
              allUsers={users}
              onSwitchUser={() => {}} // Removed for production
              onSelectUser={handleSelectUser}
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onMarkAllRead={handleMarkAllRead}
              theme={theme}
              toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              breadcrumbs={getBreadcrumbs()}
              pageTitle={getPageTitle()}
              onBack={handleBack}
              showBackButton={!!(selectedInitiativeId || selectedUserId)}
              onLogout={handleLogout}
          />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {showOnboarding && (
                  <OnboardingBanner onDismiss={() => setShowOnboarding(false)} />
                )}
                {networkError ? (
                  <NetworkError onRetry={handleRetry} isRetrying={isRetrying} />
                ) : (
                  <LoadingTransition key={viewKey} delay={50} variant="fade">
                    {renderView()}
                  </LoadingTransition>
                )}
              </div>
            </main>
        </div>
        
        {/* Feedback Button - Only visible in development */}
        <FeedbackButton />
      </div>
    </ErrorBoundary>
  );
};

export default App;