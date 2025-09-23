import React from 'react';
import { Card } from './ui/card';

const HelpWantedCardSkeleton: React.FC = () => {
    const basePulseClass = "bg-primary/20 animate-pulse";
    
    return (
        <Card className="flex flex-col bg-primary text-primary-foreground p-6 shadow-lg h-full">
            <div className="flex-grow space-y-4">
                <div className={`h-4 w-1/3 rounded ${basePulseClass}`}></div>
                <div className={`h-8 w-2/3 rounded ${basePulseClass}`}></div>
                <div className={`h-4 w-1/2 rounded ${basePulseClass}`}></div>
                <div className={`h-6 w-1/4 rounded ${basePulseClass}`}></div>
            </div>
            <div className="mt-auto pt-4 flex justify-end">
                <div className={`h-9 w-32 rounded-md ${basePulseClass}`}></div>
            </div>
        </Card>
    );
};

export default HelpWantedCardSkeleton;
