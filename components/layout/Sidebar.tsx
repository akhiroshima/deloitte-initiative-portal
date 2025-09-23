import React, { useState } from 'react';
import { Users, BarChart3, FileText, Pin, UserCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

type View = 'bulletin' | 'dashboard' | 'workspace' | 'docs' | 'opportunities';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isPinned, onTogglePin }) => {
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'bulletin', label: 'Bulletin', icon: Sparkles },
    { id: 'opportunities', label: 'Opportunities', icon: Users },
    { id: 'workspace', label: 'My Workspace', icon: UserCircle },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'docs', label: 'Documentation', icon: FileText, disabled: false },
  ];

  const handleNavClick = (view: View) => {
      setActiveView(view);
  };

  const isCollapsed = !isPinned && !isHovered;
  const showContent = isPinned || isHovered;

  return (
    <nav 
className={`relative flex flex-col border-r border-border bg-card p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 items-center' : 'w-56'}`}
      onMouseEnter={() => { if (!isPinned) setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-10 flex items-center gap-3 self-stretch">
        <div className="w-8 h-8 bg-foreground rounded-full flex-shrink-0"></div>
        {showContent && <span className="text-xl font-bold text-foreground">Deloitte</span>}
      </div>

      <ul className="flex w-full flex-col gap-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <Button
              onClick={() => handleNavClick(item.id as View)}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 text-sm font-medium ${item.disabled ? 'cursor-not-allowed opacity-50' : ''} ${isCollapsed ? 'justify-center px-2' : 'px-3'}`}
              disabled={item.disabled}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {showContent && <span>{item.label}</span>}
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-auto w-full">
        <Button 
          onClick={onTogglePin}
          variant="ghost"
          className={`w-full justify-start gap-3 text-sm font-medium mb-2 ${isCollapsed ? 'justify-center px-2' : 'px-3'}`}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          <Pin className={`h-6 w-6 shrink-0 transition-transform duration-300 ${!isPinned ? 'rotate-90' : ''}`} />
          {showContent && <span>{isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}</span>}
        </Button>
        {showContent && <p className="text-xs text-muted-foreground/50 text-center">© 2024 Deloitte</p>}
      </div>
    </nav>
  );
};

export default Sidebar;