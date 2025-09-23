import React, { useState, useEffect, useRef } from 'react';
import { User, Notification } from '../../types';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { Sun, Moon, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Breadcrumb {
  label: string;
  onClick: (() => void) | null;
}

interface HeaderProps {
    currentUser: User | null;
    allUsers: User[];
    onSwitchUser: (userId: string) => void;
    onSelectUser: (userId: string) => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkAllRead: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    breadcrumbs: Breadcrumb[];
    pageTitle: string;
    onBack: () => void;
    showBackButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentUser, allUsers, onSwitchUser, onSelectUser, notifications, onNotificationClick, onMarkAllRead, theme, toggleTheme, breadcrumbs, pageTitle, onBack, showBackButton }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwitch = (userId: string) => {
    onSwitchUser(userId);
    setIsDropdownOpen(false);
  };

  const handleViewProfile = () => {
    if(currentUser) {
        onSelectUser(currentUser.id);
        setIsDropdownOpen(false);
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left side - Breadcrumbs and Back Button */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              {breadcrumb.onClick ? (
                <button
                  onClick={breadcrumb.onClick}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  {breadcrumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right side - User controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <NotificationDropdown 
            notifications={notifications}
            onNotificationClick={onNotificationClick}
            onMarkAllRead={onMarkAllRead}
        />
        
        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-muted"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
          >
              {currentUser ? (
              <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.role}</p>
                  </div>
                  <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                  />
              </div>
              ) : (
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="hidden sm:block">
                        <div className="h-4 w-24 rounded-md bg-muted"></div>
                        <div className="h-3 w-16 rounded-md bg-muted mt-1"></div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                </div>
              )}
          </button>

          {isDropdownOpen && (
              <div 
                  className="absolute right-0 mt-2 w-64 origin-top-right rounded-md border bg-popover text-popover-foreground shadow-lg focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
              >
                  <div className="border-b border-border p-2" role="none">
                     <button onClick={handleViewProfile} className="block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted" role="menuitem">
                        My Workspace
                      </button>
                  </div>
                  <div className="py-1" role="none">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">Switch User (Dev Tool)</div>
                      <div className="max-h-64 overflow-y-auto">
                          {allUsers.map(u => (
                              <button
                                  key={u.id}
                                  onClick={() => handleSwitch(u.id)}
                                  className={`flex w-full items-center justify-between px-4 py-2 text-sm ${
                                      u.id === currentUser?.id 
                                      ? 'bg-primary/10 text-primary font-semibold' 
                                      : 'hover:bg-muted'
                                  }`}
                                  role="menuitem"
                              >
                                  <span>{u.name}</span>
                                  {u.id === currentUser?.id && <span className="text-xs">(Current)</span>}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;