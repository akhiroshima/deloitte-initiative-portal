import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface OnboardingBannerProps {
  onDismiss: () => void;
}

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 relative">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Welcome to the Deloitte Initiative Portal!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            This is your central hub for discovering, joining, and managing innovation initiatives. 
            Start by exploring the Initiative Bulletin to find opportunities that match your skills.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = '#bulletin'}
            >
              Explore Initiatives
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
