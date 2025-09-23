import React from 'react';

type SkeletonType = 'page' | 'text';

interface LoadingSkeletonProps {
  type: SkeletonType;
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 1, className = '' }) => {
  const basePulseClass = "bg-muted animate-pulse";

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`space-y-2 animate-pulse ${className}`}>
            <div className={`h-4 rounded w-3/4 ${basePulseClass}`}></div>
            <div className={`h-4 rounded w-1/2 ${basePulseClass}`}></div>
          </div>
        );
      case 'page':
      default:
        return (
            <div className="p-8 space-y-8">
                <div className={`h-10 w-1/3 rounded ${basePulseClass}`}></div>
                <div className={`h-48 rounded ${basePulseClass}`}></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`h-48 rounded-md ${basePulseClass}`}></div>
                    <div className={`h-48 rounded-md ${basePulseClass}`}></div>
                    <div className={`h-48 rounded-md ${basePulseClass}`}></div>
                </div>
            </div>
        );
    }
  };

  return renderSkeleton();
};

export default LoadingSkeleton;
