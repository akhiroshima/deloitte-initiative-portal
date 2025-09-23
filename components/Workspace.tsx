import React, { useState, useEffect, useMemo } from 'react';
import { Initiative, User, JoinRequest, JoinRequestStatus, Task } from '../types';
import * as api from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import Tag from './ui/Tag';
import { Pencil, X, Users, ClipboardList, CheckCircle, XCircle, FolderOpen } from 'lucide-react';
import AcceptInviteModal from './AcceptInviteModal';
import { useToasts } from './ui/ToastProvider';
import { typography } from '../tokens/typography';
import InitiativeCard from './InitiativeCard';
import { AVAILABLE_LOCATIONS } from '../constants';
import { ChevronRight } from 'lucide-react';


interface WorkspaceProps {
  currentUser: User;
  initiatives: Initiative[];
  joinRequests: JoinRequest[];
  tasks: Task[];
  onDataChange: () => void;
  onSelectInitiative: (id: string, tab?: 'overview' | 'requests' | 'tasks') => void;
}

type WorkspaceTab = 'profile' | 'my-tasks' | 'active' | 'pending' | 'achievements';

const Workspace: React.FC<WorkspaceProps> = ({ currentUser, initiatives, joinRequests, tasks, onDataChange, onSelectInitiative }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('profile');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkills, setEditedSkills] = useState(currentUser.skills);
  const [editedLocation, setEditedLocation] = useState(currentUser.location);
  const [editedCapacity, setEditedCapacity] = useState(currentUser.weeklyCapacityHrs.toString());
  const [newSkill, setNewSkill] = useState('');

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<JoinRequest | null>(null);
  const { addToast } = useToasts();

  useEffect(() => {
    setIsEditing(false);
    setEditedSkills(currentUser.skills);
    setEditedLocation(currentUser.location);
    setEditedCapacity(currentUser.weeklyCapacityHrs.toString());
  }, [currentUser]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedSkills(currentUser.skills);
      setEditedLocation(currentUser.location);
      setEditedCapacity(currentUser.weeklyCapacityHrs.toString());
      setNewSkill('');
    }
    setIsEditing(!isEditing);
  };
  
  const handleSave = async () => {
    try {
        await api.updateUserProfile(currentUser.id, {
            skills: editedSkills,
            location: editedLocation,
            weeklyCapacityHrs: parseInt(editedCapacity, 10) || 0,
        });
        addToast('Profile updated successfully!', 'success');
        onDataChange();
        setIsEditing(false);
    } catch (error) {
        addToast('Failed to update profile.', 'error');
        console.error(error);
    }
  };
  
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
        e.preventDefault();
        if (!editedSkills.map(s => s.toLowerCase()).includes(newSkill.trim().toLowerCase())) {
            setEditedSkills([...editedSkills, newSkill.trim()]);
        }
        setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setEditedSkills(editedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleAcceptClick = (invite: JoinRequest) => {
    setSelectedInvite(invite);
    setIsAcceptModalOpen(true);
  };
  
  const handleDeclineClick = async (inviteId: string) => {
    if (window.confirm("Are you sure you want to decline this invitation?")) {
        try {
            await api.declineInvite(inviteId);
            addToast("Invitation declined.", "info");
            onDataChange();
        } catch (error) {
            addToast("Failed to decline invitation.", "error");
        }
    }
  };
  
  const handleAcceptSubmit = async (committedHours: number) => {
    if (!selectedInvite) return;
    try {
        await api.acceptInvite(selectedInvite.id, committedHours);
        addToast("Invitation accepted! Welcome to the team.", "success");
        setIsAcceptModalOpen(false);
        setSelectedInvite(null);
        onDataChange();
    } catch (error) {
        addToast("Failed to accept invitation.", "error");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (window.confirm("Are you sure you want to withdraw your application?")) {
        try {
            await api.cancelJoinRequest(requestId);
            addToast("Application withdrawn.", "success");
            onDataChange();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to withdraw application.", "error");
            console.error(error);
        }
    }
  };

  const myActiveInitiatives = initiatives.filter(i => i.teamMembers.some(m => m.userId === currentUser.id) && i.status !== 'Completed');
  const myAchievements = initiatives.filter(i => i.teamMembers.some(m => m.userId === currentUser.id) && i.status === 'Completed');
  const myApplications = joinRequests.filter(r => r.userId === currentUser.id && r.status !== JoinRequestStatus.Invited);
  const myInvitations = joinRequests.filter(r => r.userId === currentUser.id && r.status === JoinRequestStatus.Invited);
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
  
  const tasksByInitiative = useMemo(() => {
    return myTasks.reduce((acc, task) => {
        const initiative = initiatives.find(i => i.id === task.initiativeId);
        if (initiative) {
            if (!acc[task.initiativeId]) {
                acc[task.initiativeId] = { initiative, tasks: [] };
            }
            acc[task.initiativeId].tasks.push(task);
        }
        return acc;
    }, {} as Record<string, { initiative: Initiative, tasks: Task[] }>);
  }, [myTasks, initiatives]);


  const getStatusChip = (status: JoinRequestStatus) => {
    switch(status) {
        case 'Approved': return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Approved</span>;
        case 'Rejected': return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Rejected</span>;
        default: return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">Pending</span>;
    }
  };

  const tabs: {id: WorkspaceTab, label: string}[] = [
      { id: 'profile', label: 'Profile' },
      { id: 'my-tasks', label: 'My Tasks' },
      { id: 'active', label: 'Active Initiatives' },
      { id: 'pending', label: 'Pending Items' },
      { id: 'achievements', label: 'Achievements' },
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="text-center p-6">
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-32 h-32 rounded-full mx-auto shadow-lg border-4 border-card" />
                        <h2 className={`mt-4 ${typography.h2} text-foreground`}>{currentUser.name}</h2>
                        <p className="text-muted-foreground">{currentUser.role}</p>
                        <p className="mt-2 text-sm text-primary">{currentUser.email}</p>
                        
                        {isEditing ? (
                            <div className="mt-1">
                                <label htmlFor="location-select" className="sr-only">Location</label>
                                <select 
                                    id="location-select"
                                    value={editedLocation}
                                    onChange={e => setEditedLocation(e.target.value)}
                                    className="text-center text-sm appearance-none border-none p-0 bg-transparent text-muted-foreground focus:ring-0"
                                >
                                    {AVAILABLE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                        ) : (
                            <p className="mt-1 text-sm text-muted-foreground">Location: {currentUser.location}</p>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-border">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weekly Capacity</h3>
                            {isEditing ? (
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={editedCapacity}
                                        onChange={e => setEditedCapacity(e.target.value)}
                                        className="w-20 text-center text-2xl font-bold text-foreground bg-muted rounded-md"
                                    />
                                    <span className="text-2xl font-bold text-foreground">hours</span>
                                </div>
                            ) : (
                                <p className="text-2xl font-bold text-foreground mt-1">{currentUser.weeklyCapacityHrs} hours</p>
                            )}
                        </div>
                    </Card>

                    {isEditing && (
                        <div className="mt-4 flex gap-2">
                            <Button onClick={handleSave} className="flex-1" variant="secondary">Save Changes</Button>
                            <Button onClick={handleEditToggle} variant="secondary" className="flex-1">Cancel</Button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h3 className={`${typography.h3} text-foreground mb-3`}>Your Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                                <>
                                {editedSkills.map(skill => (
                                    <span key={skill} className="flex items-center gap-1.5 rounded-md bg-muted py-0.5 pl-2 pr-1 font-medium text-muted-foreground">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="rounded-full text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                    placeholder="Add skill..."
                                    className="flex-grow bg-transparent p-1 text-sm outline-none w-full placeholder:text-muted-foreground mt-2 border-b border-input focus:border-primary"
                                />
                                </>
                            ) : (
                                currentUser.skills.length > 0 ? currentUser.skills.map(skill => <Tag key={skill}>{skill}</Tag>) : <p className="text-sm text-muted-foreground">No skills listed.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        );
      case 'my-tasks':
          return myTasks.length > 0 ? (
              <div className="space-y-6">
                  {Object.values(tasksByInitiative).map(({ initiative, tasks: initiativeTasks }) => (
                      <Card key={initiative.id} className="p-6">
                          <h3 className="text-xl font-bold text-foreground mb-2">{initiative.title}</h3>
                          <div className="divide-y divide-border -mx-6">
                              {initiativeTasks.map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => onSelectInitiative(initiative.id, 'tasks')}
                                  role="button"
                                  className="flex items-center justify-between p-4 mx-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                >
                                  <div>
                                    <p className="font-medium text-foreground">{task.title}</p>
                                    <span className="text-xs font-medium inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground mt-1">{task.status}</span>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </div>
                              ))}
                          </div>
                      </Card>
                  ))}
              </div>
          ) : (
              <Card className="text-center p-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">All clear!</h3>
                  <p className={`${typography.sectionDescription}`}>You have no tasks assigned to you right now.</p>
              </Card>
          );
      case 'active':
        return (
             myActiveInitiatives.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {myActiveInitiatives.map(init => (
                    <InitiativeCard 
                      key={init.id} 
                      initiative={init} 
                      onSelect={() => onSelectInitiative(init.id)}
                      onSelectUser={() => { /* Prohibit clicking self on this page */}}
                      currentUser={currentUser}
                      onDataChange={onDataChange}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center p-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">No Active Initiatives</h3>
                  <p className={`${typography.sectionDescription}`}>You haven't joined or created any initiatives yet.</p>
                </Card>
              )
        );
      case 'pending':
        return (
            <div className="space-y-8">
                <section>
                    <h2 className={`${typography.h2} text-foreground mb-4`}>Pending Invitations ({myInvitations.length})</h2>
                    {myInvitations.length > 0 ? (
                        <div className="space-y-4">
                        {myInvitations.map(invite => {
                            const initiative = initiatives.find(i => i.id === invite.initiativeId);
                            if (!initiative) return null;
                            return (
                            <Card key={invite.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex-grow">
                                <p className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => onSelectInitiative(initiative.id)}>{initiative.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{invite.message}</p>
                                </div>
                                <div className="flex-shrink-0 flex gap-2">
                                <Button size="sm" onClick={() => handleAcceptClick(invite)}>
                                    <CheckCircle className="h-5 w-5 mr-2 -ml-1" /> Accept
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDeclineClick(invite.id)}>
                                    <XCircle className="h-5 w-5 mr-2 -ml-1" /> Decline
                                </Button>
                                </div>
                            </Card>
                            );
                        })}
                        </div>
                    ) : (
                        <Card className="text-center p-8">
                            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium text-foreground">No Pending Invitations</h3>
                            <p className={`${typography.sectionDescription}`}>You don't have any pending project invitations.</p>
                        </Card>
                    )}
                </section>
                 <section>
                    <h2 className={`${typography.h2} text-foreground mb-4`}>Your Applications ({myApplications.length})</h2>
                    {myApplications.length > 0 ? (
                        <div className="space-y-4">
                        {myApplications.map(request => {
                            const initiative = initiatives.find(i => i.id === request.initiativeId);
                            if (!initiative) return null;
                            return (
                             <Card key={request.id} className="p-4 flex items-center justify-between gap-4">
                                <div 
                                    className="flex-grow cursor-pointer"
                                    onClick={() => onSelectInitiative(initiative.id)}
                                >
                                    <p className="font-semibold text-primary hover:underline">{initiative.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1 truncate">"{request.message}"</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    {getStatusChip(request.status)}
                                    {request.status === JoinRequestStatus.Pending && (
                                        <button 
                                            onClick={() => handleCancelRequest(request.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                                            aria-label="Cancel request"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </Card>
                            )
                        })}
                        </div>
                    ) : (
                        <Card className="text-center p-8">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No Applications Found</h3>
                        <p className={`${typography.sectionDescription}`}>You haven't applied to any initiatives yet.</p>
                        </Card>
                    )}
                </section>
            </div>
        );
      case 'achievements':
        return (
            myAchievements.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myAchievements.map(initiative => (
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
                <Card className="text-center p-8">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No Completed Initiatives</h3>
                    <p className={`${typography.sectionDescription}`}>Finish a project to see your achievements here.</p>
                </Card>
            )
        );
      default:
        return null;
    }
  }


  return (
    <>
      <AcceptInviteModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        onSubmit={handleAcceptSubmit}
        initiativeTitle={initiatives.find(i => i.id === selectedInvite?.initiativeId)?.title || ''}
      />
      <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <p className={`${typography.pageDescription}`}>Manage your profile, projects, and commitments.</p>
            </div>
            {activeTab === 'profile' && !isEditing && (
                <Button onClick={handleEditToggle}>
                    <Pencil className="h-5 w-5 -ml-1 mr-2" />
                    Edit Profile
                </Button>
            )}
        </div>
        
        <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 border-b-2 px-1 py-4 text-base font-medium ${
                        activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-8">
            {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default Workspace;