import React, { useState, useEffect } from 'react';
import { Initiative, User, InitiativeStatus } from '../types';
import * as api from '../services/api';
import Tag from './ui/Tag';
import { Button } from './ui/Button';
import RequestToJoinModal from './RequestToJoinModal';
import { useToasts } from './ui/ToastProvider';
import { Card } from './ui/Card';
import { LoadingTransition } from './ui/LoadingTransition';

interface InitiativeCardProps {
  initiative: Initiative;
  recommendationReason?: string;
  onSelect: () => void;
  onSelectUser: (userId: string) => void;
  currentUser: User | null;
  onDataChange: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const statusStyles: { [key in InitiativeStatus]: string } = {
    'Searching Talent': 'bg-secondary text-secondary-foreground',
    'In Progress': 'bg-muted text-muted-foreground border border-border',
    'Under Review': 'bg-accent text-accent-foreground',
    'Completed': 'bg-primary text-primary-foreground',
};

const InitiativeCard: React.FC<InitiativeCardProps> = ({ initiative, recommendationReason, onSelect, onSelectUser, currentUser, onDataChange, style, className }) => {
  const [owner, setOwner] = useState<User | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const { addToast } = useToasts();

  useEffect(() => {
    const fetchOwner = async () => {
      const user = await api.getUserById(initiative.ownerId);
      if(user) setOwner(user);
    };
    fetchOwner();
  }, [initiative.ownerId]);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmitted = () => {
    addToast('Request to join sent!', 'success');
    onDataChange();
  };
  
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    onSelectUser(userId);
  }

  const isTeamMember = currentUser ? initiative.teamMembers.some(m => m.userId === currentUser.id) : false;
  const isJoinable = initiative.status === 'Searching Talent' || initiative.status === 'In Progress';
  const showJoinButton = !isTeamMember && isJoinable;

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
      <LoadingTransition delay={Math.random() * 100} variant="fade">
        <Card
className={`group relative h-full cursor-pointer p-0 flex flex-col overflow-hidden transition-colors duration-200 ease-in-out hover:border-primary hover:shadow-md dark:hover:shadow-primary/10 ${className || ''}`}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onSelect()}
        style={style}
      >
        <img src={initiative.coverImageUrl} alt={initiative.title} className="h-36 w-full object-cover" />
        <div className="p-5 flex flex-col flex-grow">
          {recommendationReason && (
              <div className="mb-3 rounded-md border border-accent/50 bg-accent p-2 text-xs text-accent-foreground">
                  <p><span className="font-semibold">Match reason:</span> {recommendationReason}</p>
              </div>
          )}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-semibold text-foreground leading-tight">{initiative.title}</h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            {owner ? (
                <button onClick={(e) => handleUserClick(e, owner.id)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted transition-colors">
                    <img src={owner.avatarUrl} alt={owner.name} className="h-5 w-5 rounded-full" />
                    <span className="font-semibold text-foreground">{owner.name}</span>
                </button>
            ) : (
                <div className="h-5 w-24 rounded-full bg-muted animate-pulse"></div>
            )}
            <span className="text-border">|</span>
            <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${statusStyles[initiative.status] || 'bg-muted text-muted-foreground'}`}>
              {initiative.status}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-4 flex-grow">{initiative.description.substring(0, 100)}{initiative.description.length > 100 ? '...' : ''}</p>
          
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Skills Needed</h4>
            <div className="flex flex-wrap gap-1.5">
              {initiative.skillsNeeded.slice(0, 4).map(skill => <Tag key={skill}>{skill}</Tag>)}
              {initiative.skillsNeeded.length > 4 && <Tag>+{initiative.skillsNeeded.length - 4} more</Tag>}
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border/50 flex justify-end">
            {showJoinButton && (
              <Button onClick={handleJoinClick} size="sm">
                Request to Join
              </Button>
            )}
          </div>
        </div>
      </Card>
      </LoadingTransition>
    </>
  );
};

export default InitiativeCard;