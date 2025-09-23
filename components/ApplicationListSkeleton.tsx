import React from 'react';
import { Card } from './ui/card';

const ApplicationListSkeleton: React.FC = () => {
    const basePulseClass = "bg-muted animate-pulse";

    return (
        <Card className="p-4 flex items-center justify-between gap-4">
            <div className="flex-grow space-y-2">
                <div className={`h-5 w-1/3 rounded ${basePulseClass}`}></div>
                <div className={`h-4 w-2/3 rounded ${basePulseClass}`}></div>
            </div>
            <div className={`h-6 w-24 rounded-full flex-shrink-0 ${basePulseClass}`}></div>
        </Card>
    );
};

export default ApplicationListSkeleton;
