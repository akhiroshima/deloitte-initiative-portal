import React from 'react';
import { Card } from './ui/Card';

const InitiativeCardSkeleton: React.FC = () => {
    const basePulseClass = "bg-muted animate-pulse";
    
    return (
        <Card className="p-0 flex flex-col overflow-hidden">
            <div className={`h-40 w-full ${basePulseClass}`}></div>
            <div className="p-5 flex flex-col flex-grow">
                <div className={`h-4 w-3/4 rounded ${basePulseClass} mb-2`}></div>
                
                <div className="flex items-center gap-2 mb-3">
                    <div className={`h-5 w-5 rounded-full ${basePulseClass}`}></div>
                    <div className={`h-4 w-24 rounded ${basePulseClass}`}></div>
                </div>

                <div className={`h-4 w-full rounded ${basePulseClass} mb-1`}></div>
                <div className={`h-4 w-5/6 rounded ${basePulseClass} mb-4`}></div>
                
                <div className="mb-4">
                    <div className={`h-3 w-20 rounded ${basePulseClass} mb-1.5`}></div>
                    <div className="flex flex-wrap gap-1.5">
                        <div className={`h-6 w-16 rounded-md ${basePulseClass}`}></div>
                        <div className={`h-6 w-20 rounded-md ${basePulseClass}`}></div>
                        <div className={`h-6 w-12 rounded-md ${basePulseClass}`}></div>
                    </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border/50 flex justify-end">
                    <div className={`h-9 w-28 rounded-md ${basePulseClass}`}></div>
                </div>
            </div>
        </Card>
    );
};

export default InitiativeCardSkeleton;
