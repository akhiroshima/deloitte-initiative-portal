import React from 'react';
import { Card } from './ui/card';

const UserCardSkeleton: React.FC = () => {
    const basePulseClass = "bg-muted animate-pulse";

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex-shrink-0 ${basePulseClass}`}></div>
                <div className="flex-grow space-y-2">
                    <div className={`h-5 w-3/4 rounded ${basePulseClass}`}></div>
                    <div className={`h-4 w-1/2 rounded ${basePulseClass}`}></div>
                </div>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <div className={`h-4 w-1/3 rounded ${basePulseClass}`}></div>
                    <div className={`h-3 w-1/4 rounded ${basePulseClass}`}></div>
                </div>
                <div className={`w-full rounded-full h-2.5 ${basePulseClass}`}></div>
            </div>

            <div>
                <div className={`h-4 w-1/3 mb-2 rounded ${basePulseClass}`}></div>
                 <div className="flex flex-col gap-2">
                    <div className={`h-9 w-full rounded-md ${basePulseClass}`}></div>
                    <div className={`h-9 w-full rounded-md ${basePulseClass}`}></div>
                </div>
            </div>
        </Card>
    );
};

export default UserCardSkeleton;
