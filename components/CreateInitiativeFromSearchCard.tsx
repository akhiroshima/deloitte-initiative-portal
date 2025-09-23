import React from 'react';
import { Plus } from "lucide-react"
import { Sparkles } from "lucide-react"
import { Button } from './ui/button';

interface CreateInitiativeFromSearchCardProps {
  onClick: () => void;
  disabled: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const CreateInitiativeFromSearchCard: React.FC<CreateInitiativeFromSearchCardProps> = ({ onClick, disabled, style, className }) => {
  return (
    <div className={`h-full ${className || ''}`} style={style}>
        <Button
          onClick={onClick}
          disabled={disabled}
          variant="outline"
          className="group h-full w-full rounded-md border-2 border-dashed border-border bg-card hover:border-primary hover:bg-accent transition-all duration-200 flex flex-col items-center justify-center p-5 text-center disabled:opacity-75 disabled:cursor-wait"
        >
          {disabled ? (
            <>
              <Sparkles className="h-12 w-12 text-muted-foreground animate-pulse" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Analyzing your idea...</h3>
              <p className="mt-1 text-sm text-muted-foreground">We're preparing the form for you.</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">Create Initiative from your Idea</h3>
              <p className="mt-1 text-sm text-muted-foreground">Bring your vision to life and start a new project.</p>
            </>
          )}
        </Button>
    </div>
  );
};

export default CreateInitiativeFromSearchCard;