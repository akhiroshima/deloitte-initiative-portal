import React, { useState } from 'react';
import { User, Initiative } from '../types';
import * as api from '../services/api';
import { Card } from './ui/Card';
import Tag from './ui/Tag';
import { Button } from './ui/Button';
import { ArrowLeft } from "lucide-react"
import { useToasts } from './ui/ToastProvider';
import InviteToProjectModal from './InviteToProjectModal';


interface UserProfileProps {
    user: User;
    allInitiatives: Initiative[];
    onSelectInitiative: (id: string) => void;
    onBack: () => void;
    currentUser: User;
    onDataChange: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, allInitiatives, onSelectInitiative, onBack, currentUser, onDataChange }) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { addToast } = useToasts();

    const userInitiatives = allInitiatives.filter(i => i.teamMembers.some(m => m.userId === user.id) && i.status !== 'Completed');
    const userAchievements = allInitiatives.filter(i => i.teamMembers.some(m => m.userId === user.id) && i.status === 'Completed');
    
    // A user can invite someone if they are a member of any active project.
    const currentUserIsMemberOfSomeProject = allInitiatives.some(i => 
        (i.status === 'In Progress' || i.status === 'Searching Talent') &&
        i.teamMembers.some(m => m.userId === currentUser.id)
    );

    return (
        <>
        <InviteToProjectModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            invitee={user}
            currentUser={currentUser}
            allInitiatives={allInitiatives}
            onDataChange={onDataChange}
        />
        <div className="space-y-6">
             <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    {currentUserIsMemberOfSomeProject && (
                        <Button onClick={() => setIsInviteModalOpen(true)}>Invite to Project</Button>
                    )}
                </div>
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="text-center p-6">
                        <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full mx-auto shadow-lg border-4 border-card" />
                        <h1 className="mt-4 text-2xl font-bold text-foreground">{user.name}</h1>
                        <p className="text-muted-foreground">{user.role}</p>
                        <p className="mt-2 text-sm text-primary">{user.email}</p>
                        <p className={`${typography.sectionDescription}`}>Location: {user.location}</p>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weekly Capacity</h3>
                            <p className="text-2xl font-bold text-foreground mt-1">{user.weeklyCapacityHrs} hours</p>
                        </div>
                    </Card>

                     <Card className="mt-6 p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.length > 0 ? user.skills.map(skill => <Tag key={skill}>{skill}</Tag>) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                        </div>
                     </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Active Initiatives ({userInitiatives.length})</h2>
                        {userInitiatives.length > 0 ? (
                             <div className="space-y-4">
                                {userInitiatives.map(initiative => (
                                    <div 
                                        key={initiative.id} 
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-border"
                                        onClick={() => onSelectInitiative(initiative.id)}
                                    >
                                        <img src={initiative.coverImageUrl} alt={initiative.title} className="w-24 h-16 rounded-md object-cover flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-primary">{initiative.title}</p>
                                            <p className="text-sm text-muted-foreground">{initiative.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">This user is not currently on any active initiatives.</p>
                        )}
                    </Card>
                     <Card className="p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Achievements ({userAchievements.length})</h2>
                        {userAchievements.length > 0 ? (
                             <div className="space-y-4">
                                {userAchievements.map(initiative => (
                                    <div 
                                        key={initiative.id} 
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-border"
                                        onClick={() => onSelectInitiative(initiative.id)}
                                    >
                                        <img src={initiative.coverImageUrl} alt={initiative.title} className="w-24 h-16 rounded-md object-cover flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-foreground">{initiative.title}</p>
                                            <p className="text-sm text-muted-foreground">Completed on {new Date(initiative.endDate!).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No completed initiatives yet.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
        </>
    );
}

export default UserProfile;