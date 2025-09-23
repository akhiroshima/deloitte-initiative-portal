import React, { useState, useEffect } from 'react';
import { HelpWanted, Initiative, User } from '../types';
import { getInitiativeById } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import RequestToJoinModal from './RequestToJoinModal';

interface HelpWantedCardProps {
  post: HelpWanted;
  currentUser: User | null;
  onDataChange: () => void;
  recommendationReason?: string;
}

const HelpWantedCard: React.FC<HelpWantedCardProps> = ({ post, currentUser, onDataChange, recommendationReason }) => {
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitiative = async () => {
      const data = await getInitiativeById(post.initiativeId);
      if (data) setInitiative(data);
    };
    fetchInitiative();
  }, [post.initiativeId]);

  const handleInterestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmitted = () => {
    onDataChange();
  };

  if (!initiative) {
    return <Card className="p-6 bg-muted animate-pulse h-48"></Card>;
  }

  return (
    <>
      <RequestToJoinModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmitted={handleRequestSubmitted}
        initiativeId={initiative.id}
        initiativeTitle={initiative.title}
        currentUser={currentUser}
      />
      <Card className="flex flex-col p-5 h-full">
        <div className="flex-grow">
          {recommendationReason && (
              <div className="mb-3 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 p-2 text-xs text-primary-foreground">
                  <p><span className="font-semibold">Match reason:</span> {recommendationReason}</p>
              </div>
          )}
          <p className="text-xs font-medium text-muted-foreground">Help Wanted</p>
          <h3 className="text-lg font-semibold text-foreground mt-1 leading-tight">{post.skill}</h3>
          <p className="text-xs text-muted-foreground mt-1">For: {initiative.title}</p>
          <p className="text-sm text-foreground mt-3">{post.hoursPerWeek} hrs/week</p>
        </div>
        <div className="mt-auto pt-4 flex justify-end">
          <Button 
            variant="secondary" 
            onClick={handleInterestClick}
            className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-primary-foreground/20"
          >
            Express Interest
          </Button>
        </div>
      </Card>
    </>
  );
};

export default HelpWantedCard;