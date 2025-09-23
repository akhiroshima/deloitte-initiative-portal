import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fade' | 'slide' | 'scale';
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  children,
  className,
  delay = 0,
  variant = 'fade'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const variants = {
    fade: {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 translate-y-1'
    },
    slide: {
      enter: 'opacity-100 translate-x-0',
      exit: 'opacity-0 -translate-x-2'
    },
    scale: {
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95'
    }
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isLoaded ? variants[variant].enter : variants[variant].exit,
        className
      )}
    >
      {children}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'button' | 'avatar' | 'input';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'text' 
}) => {
  const variants = {
    text: 'h-4 bg-muted rounded animate-pulse',
    card: 'h-32 bg-muted rounded-lg animate-pulse',
    button: 'h-10 bg-muted rounded-md animate-pulse',
    avatar: 'h-10 w-10 bg-muted rounded-full animate-pulse',
    input: 'h-10 bg-muted rounded-md animate-pulse'
  };

  return (
    <div className={cn(variants[variant], className)} />
  );
};
