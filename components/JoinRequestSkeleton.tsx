import React from 'react';
import { Card } from './ui/card';

const JoinRequestSkeleton: React.FC = () => {
    const basePulseClass = "bg-muted animate-pulse";
    return (
        <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full ${basePulseClass}`}></div>
                    <div className="space-y-2">
                        <div className={`h-4 w-32 rounded ${basePulseClass}`}></div>
                        <div className={`h-3 w-48 rounded ${basePulseClass}`}></div>
                    </div>
                </div>
                <div className={`h-6 w-20 rounded-full flex-shrink-0 ${basePulseClass}`}></div>
            </div>
            <div className="mt-4 sm:pl-16">
                <div className={`h-16 w-full rounded-md ${basePulseClass}`}></div>
            </div>
        </Card>
    );
};

export default JoinRequestSkeleton;
