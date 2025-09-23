import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Bulletin from './components/Bulletin';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';
import InitiativeDetail from './components/InitiativeDetail';
import UserProfile from './components/UserProfile';
import DocsPage from './components/DocsPage';
import OpportunitiesPage from './components/OpportunitiesPage';
import * as api from './services/api';
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

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleDataChange = useCallback(async () => {
    // Don't set loading to true here to avoid full-screen loader on re-fetches
    if (!api.getCurrentUser) return;
    try {
      const currentUserData = await api.getCurrentUser();
      setCurrentUser(currentUserData);
      
      const [initiativesData, helpWantedData, usersData, joinRequestsData, tasksData, notificationsData] = await Promise.all([
        api.getInitiatives(),
        api.getHelpWantedPosts(),
        api.getUsers(),
        api.getAllJoinRequests(),
        api.getAllTasks(),
        api.getNotificationsForUser(currentUserData.id)
      ]);
      setInitiatives(initiativesData);
      setHelpWanted(helpWantedData);
      setUsers(usersData);
      setJoinRequests(joinRequestsData);
      setTasks(tasksData);
      setNotifications(notificationsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (error) {
      console.error("Failed to fetch app data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    handleDataChange();
  }, [handleDataChange]);

  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    setSelectedInitiativeId(null); 
    setSelectedUserId(null);
    setActiveView('bulletin');
    api.setCurrentUserId(userId);
    await handleDataChange();
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

  return (
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
            onSwitchUser={handleSwitchUser}
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
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <LoadingTransition key={viewKey} delay={50} variant="fade">
              {renderView()}
            </LoadingTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;