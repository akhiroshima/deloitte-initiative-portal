import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
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
import { Notification } from './types';
import LoadingSkeleton from './components/ui/LoadingSkeleton';
import { LoadingTransition } from './components/ui/LoadingTransition';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';

type View = 'bulletin' | 'dashboard' | 'workspace' | 'docs' | 'opportunities';
type Theme = 'light' | 'dark';

function pathToView(pathname: string): View {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/workspace')) return 'workspace';
  if (pathname.startsWith('/docs')) return 'docs';
  if (pathname.startsWith('/opportunities')) return 'opportunities';
  return 'bulletin';
}

function AppContent() {
  const { currentUser, logout, setShowAuthModal } = useAuth();
  const {
    initiatives,
    helpWanted,
    users,
    tasks,
    joinRequests,
    notifications,
    loading,
    networkError,
    refreshData,
    setNotifications,
  } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    (new Date().getHours() >= 18 || new Date().getHours() < 8) ? 'dark' : 'light'
  );

  const pathname = location.pathname;
  const params = useParams<{ id?: string }>();
  const activeView = pathToView(pathname);
  const initiativeId = pathname.startsWith('/initiative/') ? (params.id ?? null) : null;
  const userId = pathname.startsWith('/user/') ? (params.id ?? null) : null;
  const tabParam = searchParams.get('tab') as 'overview' | 'requests' | 'tasks' | null;
  const detailPageTab = tabParam && ['overview', 'requests', 'tasks'].includes(tabParam) ? tabParam : 'overview';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleSetView = (view: View) => {
    if (view === 'bulletin') navigate('/');
    else navigate('/' + view);
  };

  const handleSelectInitiative = (id: string, tab: 'overview' | 'requests' | 'tasks' = 'overview') => {
    navigate(tab === 'overview' ? `/initiative/${id}` : `/initiative/${id}?tab=${tab}`);
  };

  const handleSelectUser = (id: string) => {
    if (currentUser && id === currentUser.id) {
      navigate('/workspace');
      return;
    }
    navigate(`/user/${id}`);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.link?.view === 'workspace') navigate('/workspace');
    else if (notification.link?.initiativeId)
      navigate(notification.link.tab ? `/initiative/${notification.link.initiativeId}?tab=${notification.link.tab}` : `/initiative/${notification.link.initiativeId}`);

    if (!notification.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      try {
        await api.markNotificationAsRead(notification.id);
      } catch (e) {
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)));
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount === 0) return;
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsAsRead(currentUser.id);
    } catch {
      setNotifications(original);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshData();
    setIsRetrying(false);
  };

  const selectedInitiative = initiativeId ? initiatives.find((i) => i.id === initiativeId) : null;
  const selectedUser = userId ? users.find((u) => u.id === userId) : null;

  const getBreadcrumbs = () => {
    const breadcrumbs: { label: string; onClick: (() => void) | null }[] = [];
    if (selectedInitiative) {
      breadcrumbs.push({ label: 'Bulletin', onClick: () => handleSetView('bulletin') });
      breadcrumbs.push({ label: selectedInitiative.title, onClick: null });
    } else if (selectedUser) {
      breadcrumbs.push({ label: 'Dashboard', onClick: () => handleSetView('dashboard') });
      breadcrumbs.push({ label: selectedUser.name, onClick: null });
    } else {
      breadcrumbs.push({
        label:
          activeView === 'dashboard'
            ? 'Dashboard'
            : activeView === 'workspace'
              ? 'My Workspace'
              : activeView === 'docs'
                ? 'Documentation'
                : activeView === 'opportunities'
                  ? 'Opportunities'
                  : 'Bulletin',
        onClick: null,
      });
    }
    return breadcrumbs;
  };

  const getPageTitle = () => {
    if (selectedInitiative) return selectedInitiative.title;
    if (selectedUser) return selectedUser.name;
    return activeView === 'dashboard'
      ? 'Dashboard'
      : activeView === 'workspace'
        ? 'My Workspace'
        : activeView === 'docs'
          ? 'Documentation'
          : activeView === 'opportunities'
            ? 'Opportunities'
            : 'Bulletin';
  };

  const handleBack = () => {
    if (initiativeId || userId) navigate(-1);
    else handleSetView('bulletin');
  };

  if (loading || !currentUser) {
    return <LoadingSkeleton type="page" />;
  }

  const viewKey = pathname;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        setActiveView={handleSetView}
        isPinned={isSidebarPinned}
        onTogglePin={() => setIsSidebarPinned((p) => !p)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={handleSelectUser}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          theme={theme}
          toggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          breadcrumbs={getBreadcrumbs()}
          pageTitle={getPageTitle()}
          onBack={handleBack}
          showBackButton={!!(initiativeId || userId)}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {showOnboarding && <OnboardingBanner onDismiss={() => setShowOnboarding(false)} />}
            {networkError ? (
              <NetworkError onRetry={handleRetry} isRetrying={isRetrying} />
            ) : (
              <LoadingTransition key={viewKey} delay={50} variant="fade">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Bulletin
                        initiatives={initiatives}
                        currentUser={currentUser}
                        users={users}
                        onSelectInitiative={handleSelectInitiative}
                        onDataChange={refreshData}
                        onSelectUser={handleSelectUser}
                      />
                    }
                  />
                  <Route path="/dashboard" element={<Dashboard initiatives={initiatives} users={users} tasks={tasks} onSelectInitiative={handleSelectInitiative} onSelectUser={handleSelectUser} />} />
                  <Route
                    path="/workspace"
                    element={
                      <Workspace
                        currentUser={currentUser}
                        initiatives={initiatives}
                        joinRequests={joinRequests}
                        tasks={tasks}
                        onSelectInitiative={handleSelectInitiative}
                        onDataChange={refreshData}
                      />
                    }
                  />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route
                    path="/opportunities"
                    element={
                      <OpportunitiesPage
                        helpWanted={helpWanted}
                        initiatives={initiatives}
                        currentUser={currentUser}
                        onDataChange={refreshData}
                        onSelectInitiative={handleSelectInitiative}
                      />
                    }
                  />
                  <Route
                    path="/initiative/:id"
                    element={
                      selectedInitiative ? (
                        <InitiativeDetail
                          initiative={selectedInitiative}
                          currentUser={currentUser}
                          users={users}
                          tasks={tasks.filter((t) => t.initiativeId === selectedInitiative.id)}
                          helpWanted={helpWanted}
                          onBack={() => navigate(-1)}
                          onDataChange={refreshData}
                          onSelectUser={handleSelectUser}
                          initialTab={detailPageTab}
                        />
                      ) : (
                        <LoadingSkeleton type="page" />
                      )
                    }
                  />
                  <Route
                    path="/user/:id"
                    element={
                      selectedUser ? (
                        <UserProfile
                          user={selectedUser}
                          allInitiatives={initiatives}
                          onSelectInitiative={handleSelectInitiative}
                          onBack={() => navigate(-1)}
                          currentUser={currentUser}
                          onDataChange={refreshData}
                        />
                      ) : (
                        <LoadingSkeleton type="page" />
                      )
                    }
                  />
                </Routes>
              </LoadingTransition>
            )}
          </div>
        </main>
      </div>
      <FeedbackButton />
    </div>
  );
}

function AppInner() {
  const { currentUser, authLoading, isAuthenticated, showAuthModal, setShowAuthModal, checkAuth, login } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    checkAuth().then(() => setInitialized(true));
  }, [initialized, checkAuth]);

  if (!initialized || authLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{authLoading ? 'Checking authentication...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={login} />
      </div>
    );
  }

  return (
    <DataProvider currentUserId={currentUser!.id}>
      <AppContent />
    </DataProvider>
  );
}

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
