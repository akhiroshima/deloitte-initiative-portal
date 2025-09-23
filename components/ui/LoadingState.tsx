import React from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  className 
}) => {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Spinner size={size} />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
};

export { LoadingState };
