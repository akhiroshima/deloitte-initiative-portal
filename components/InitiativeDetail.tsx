import React, { useState, useEffect } from 'react';
import { Initiative, User, InitiativeStatus, JoinRequest, JoinRequestStatus, Task, HelpWanted } from '../types';
import * as api from '../services/api';
import { ArrowLeft, ClipboardList, Plus, ChevronDown, MessageCircle, CheckCircle, XCircle, Pencil, Trash2, FolderOpen, Users } from 'lucide-react';
import { Card } from './ui/card';
import Tag from './ui/Tag';
import { Button } from './ui/button';
import { typography } from '../tokens/typography';
import CreateHelpWantedModal from './CreateHelpWantedModal';
import TasksBoard from './tasks/TasksBoard';
import RequestToJoinModal from './RequestToJoinModal';
import { useToasts } from './ui/ToastProvider';
import JoinRequestSkeleton from './JoinRequestSkeleton';


interface InitiativeDetailProps {
  initiative: Initiative;
  currentUser: User;
  users: User[];
  tasks: Task[];
  helpWanted: HelpWanted[];
  onBack: () => void;
  onDataChange: () => void;
  onSelectUser: (userId: string) => void;
  initialTab?: 'overview' | 'requests' | 'tasks';
}

const InitiativeDetail: React.FC<InitiativeDetailProps> = ({ initiative, currentUser, users, tasks, helpWanted, onBack, onDataChange, onSelectUser, initialTab = 'overview' }) => {
  const [isHelpWantedModalOpen, setIsHelpWantedModalOpen] = useState(false);
  const [editingHelpWanted, setEditingHelpWanted] = useState<HelpWanted | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingCommitmentFor, setEditingCommitmentFor] = useState<string | null>(null);
  const [newCommitment, setNewCommitment] = useState(0);

  const { addToast } = useToasts();

  const owner = users.find(u => u.id === initiative.ownerId);
  const teamMembers = initiative.teamMembers
    .map(member => ({
        user: users.find(u => u.id === member.userId),
        committedHours: member.committedHours,
    }))
    .filter((m): m is { user: User, committedHours: number } => !!m.user);
    
  const isOwner = currentUser.id === initiative.ownerId;
  const isTeamMember = initiative.teamMembers.some(m => m.userId === currentUser.id);

  const initiativeHelpWanted = helpWanted.filter(p => p.initiativeId === initiative.id);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initiative && activeTab === 'requests') {
      const fetchRequests = async () => {
        setIsLoadingRequests(true);
        try {
          const requests = await api.getJoinRequestsForInitiative(initiative.id);
          setJoinRequests(requests.filter(r => r.status !== 'Invited')); // Don't show invites here
        } catch (error) {
          console.error("Failed to fetch join requests", error);
        } finally {
          setIsLoadingRequests(false);
        }
      };
      fetchRequests();
    }
  }, [initiative, onDataChange, activeTab]);

  const handleRequestToJoin = () => {
    setIsRequestModalOpen(true);
  };
  
  const handleSaveHelpWanted = async (data: { skill: string; hoursPerWeek: number; status: 'Open' | 'Closed' }) => {
    try {
        if (editingHelpWanted) {
            await api.updateHelpWantedPost(editingHelpWanted.id, data);
            addToast('Help Wanted post updated.', 'success');
        } else {
            await api.createHelpWantedPost({ ...data, initiativeId: initiative.id });
            addToast('Help Wanted post created.', 'success');
        }
        onDataChange();
        setIsHelpWantedModalOpen(false);
        setEditingHelpWanted(null);
    } catch(error) {
        addToast('Failed to save Help Wanted post.', 'error');
        console.error(error);
    }
  };

  const handleDeleteHelpWanted = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this Help Wanted post?')) {
        try {
            await api.deleteHelpWantedPost(postId);
            addToast('Help Wanted post deleted.', 'info');
            onDataChange();
        } catch (error) {
            addToast('Failed to delete post.', 'error');
            console.error(error);
        }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingHelpWanted(null);
    setIsHelpWantedModalOpen(true);
  };

  const handleOpenEditModal = (post: HelpWanted) => {
    setEditingHelpWanted(post);
    setIsHelpWantedModalOpen(true);
  };
  
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as InitiativeStatus;
    await api.updateInitiativeStatus(initiative.id, newStatus);
    addToast('Initiative status updated.', 'success');
    onDataChange();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const handleApprove = async (requestId: string) => {
    await api.approveJoinRequest(requestId);
    addToast('Request approved.', 'success');
    onDataChange();
  };

  const handleReject = async (requestId: string) => {
    await api.rejectJoinRequest(requestId);
    addToast('Request rejected.', 'info');
    onDataChange();
  };

  const handleRequestSubmitted = () => {
    addToast('Request to join sent!', 'success');
    onDataChange();
  };

  const handleEditCommitment = (member: {user: User, committedHours: number}) => {
    setNewCommitment(member.committedHours);
    setEditingCommitmentFor(member.user.id);
  }
  
  const handleSaveCommitment = async (userId: string) => {
    try {
        await api.updateCommitment(initiative.id, userId, newCommitment);
        addToast("Commitment updated successfully.", "success");
        onDataChange();
        setEditingCommitmentFor(null);
    } catch (error) {
        addToast("Failed to update commitment.", "error");
    }
  };

  const handleDeleteInitiative = async () => {
    if (window.confirm('Are you sure you want to permanently delete this initiative? This will also delete all associated tasks, roles, and requests. This action cannot be undone.')) {
        try {
            await api.deleteInitiative(initiative.id);
            addToast('Initiative deleted successfully.', 'success');
            onDataChange();
            onBack(); // Go back to the previous view
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to delete initiative.', 'error');
            console.error(error);
        }
    }
  };

  const canJoin = !isTeamMember && (initiative.status === 'Searching Talent' || initiative.status === 'In Progress');

  return (
    <>
    <CreateHelpWantedModal 
        isOpen={isHelpWantedModalOpen}
        onClose={() => setIsHelpWantedModalOpen(false)}
        onSave={handleSaveHelpWanted}
        initialData={editingHelpWanted}
    />
     <RequestToJoinModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmitted={handleRequestSubmitted}
        initiativeId={initiative.id}
        initiativeTitle={initiative.title}
        currentUser={currentUser}
      />
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Page title removed - now handled by header */}
        </div>
         <div className="mt-4 h-72 w-full overflow-hidden rounded-md shadow">
            <img src={initiative.coverImageUrl} alt={initiative.title} className="h-full w-full object-cover" />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 border-b-2 px-1 pb-4 text-base font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Overview
          </button>
          {isTeamMember && (
           <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 shrink-0 border-b-2 px-1 pb-4 text-base font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <ClipboardList className="h-5 w-5"/>
            Tasks
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${activeTab === 'tasks' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {tasks.length}
            </span>
          </button>
          )}
          {isOwner && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 shrink-0 border-b-2 px-1 pb-4 text-base font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <MessageCircle className="h-5 w-5"/>
              Requests 
              {isLoadingRequests ? <div className="h-5 w-5 rounded-full bg-muted animate-pulse"></div> : 
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${activeTab === 'requests' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {joinRequests.filter(r => r.status === JoinRequestStatus.Pending).length}
              </span>}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8" key={activeTab}>
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 animate-fadeIn">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="p-5">
<h2 className={`${typography.h2} text-foreground mb-2`}>Description</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{initiative.description}</p>
                </Card>
                <Card className="p-5">
                    <div className="flex justify-between items-center mb-3">
<h2 className={`${typography.h2} text-foreground`}>Open Roles ({initiativeHelpWanted.length})</h2>
                        {isOwner && (
                            <Button variant="secondary" onClick={handleOpenCreateModal}>
                                <Plus className="h-5 w-5 -ml-1 mr-2"/>
                                Add Role
                            </Button>
                        )}
                    </div>
                    {initiativeHelpWanted.length > 0 ? (
                        <div className="space-y-4">
                            {initiativeHelpWanted.map(post => (
<div key={post.id} className="flex justify-between items-center p-3 rounded-md bg-muted">
                                    <div>
                                        <p className="font-semibold text-foreground">{post.skill}</p>
                                        <p className="text-sm text-muted-foreground">{post.hoursPerWeek} hrs/week</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full ${post.status === 'Open' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-secondary text-secondary-foreground'}`}>{post.status}</span>
                                        {isOwner && (
                                            <>
                                            <button onClick={() => handleOpenEditModal(post)} className="p-1.5 text-muted-foreground hover:text-primary" aria-label="Edit">
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDeleteHelpWanted(post.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-medium text-foreground">No Open Roles</h3>
                          <p className="mt-1 text-sm text-muted-foreground">No specific roles have been posted for this initiative yet.</p>
                        </div>
                    )}
                </Card>
                <Card className="p-5">
<h2 className={`${typography.h2} text-foreground mb-3`}>Team Members ({teamMembers.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teamMembers.map(member => (
                          <div key={member.user.id}>
<div className="flex items-center gap-4 p-3 rounded-md hover:bg-muted transition-colors text-left">
                                <button onClick={() => onSelectUser(member.user.id)}>
                                    <img src={member.user.avatarUrl} alt={member.user.name} className="h-12 w-12 rounded-full" />
                                </button>
                                <div className="flex-grow">
                                    <button onClick={() => onSelectUser(member.user.id)}>
                                      <p className="font-semibold text-lg text-foreground hover:text-primary">{member.user.name}</p>
                                    </button>
                                    <p className="text-sm text-muted-foreground">{member.user.role}</p>
                                </div>
                            </div>
                            <div className="mt-2 pl-[64px]">
                                {editingCommitmentFor === member.user.id ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="40"
                                                value={newCommitment}
                                                onChange={(e) => setNewCommitment(Number(e.target.value))}
                                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="font-semibold text-foreground text-sm">{newCommitment}h</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSaveCommitment(member.user.id)}>Save</Button>
                                            <Button size="sm" variant="secondary" onClick={() => setEditingCommitmentFor(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-primary">{member.committedHours} hours / week</p>
                                        {currentUser.id === member.user.id && (
                                            <button onClick={() => handleEditCommitment(member)} className="text-muted-foreground hover:text-primary">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                          </div>
                      ))}
                  </div>
                </Card>
              </div>

              {/* Right Column (Sticky) */}
              <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0 lg:sticky lg:top-8 self-start">
                <Card className="p-5">
<h2 className={`${typography.h2} text-foreground mb-3`}>Details</h2>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-4">
                      <span className="font-semibold text-muted-foreground w-24 flex-shrink-0">Owner</span>
                      {owner ? (
                          <button onClick={() => onSelectUser(owner.id)} className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-muted transition-colors">
                              <img src={owner.avatarUrl} alt={owner.name} className="h-6 w-6 rounded-full" />
                              <span className="text-foreground font-semibold">{owner.name}</span>
                          </button>
                      ) : <div className="h-6 w-24 bg-muted animate-pulse rounded-full"></div>}
                    </li>
                    <li className="flex items-center gap-4">
                      <span className="font-semibold text-muted-foreground w-24 flex-shrink-0">Status</span>
                       {isOwner && initiative.status !== 'Completed' ? (
                          <div className="relative w-full">
                            <select 
                              value={initiative.status}
                              onChange={handleStatusChange}
                              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                            >
                                <option value="Searching Talent">Searching Talent</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                          </div>
                        ) : (
                          <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">{initiative.status}</span>
                        )}
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="font-semibold text-muted-foreground w-24 flex-shrink-0">Dates</span>
                      <span className="text-foreground">{formatDate(initiative.startDate)}{initiative.endDate ? ` - ${formatDate(initiative.endDate)}` : ''}</span>
                    </li>
                  </ul>
                  <div className="mt-6 pt-6 border-t border-border space-y-2">
                      {canJoin && (
                          <Button className="w-full" onClick={handleRequestToJoin}>Request to Join</Button>
                      )}
                  </div>
                  {isOwner && (
                    <div className="mt-4 pt-4 border-t border-destructive/20">
                        <Button variant="destructive" className="w-full" onClick={handleDeleteInitiative}>
                            <Trash2 className="h-5 w-5 mr-2 -ml-1" />
                            Delete Initiative
                        </Button>
                    </div>
                   )}
                </Card>
                
                {initiative.skillsNeeded.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Skills Needed</h2>
                    <div className="flex flex-wrap gap-2">
                      {initiative.skillsNeeded.map(skill => <Tag key={skill}>{skill}</Tag>)}
                    </div>
                  </Card>
                )}

                {initiative.locations.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Locations</h2>
                    <div className="flex flex-wrap gap-2">
                      {initiative.locations.map(loc => <Tag key={loc}>{loc}</Tag>)}
                    </div>
                  </Card>
                )}

                 {initiative.tags.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {initiative.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                    </div>
                  </Card>
                )}
              </div>
            </div>
        )}
        {activeTab === 'tasks' && isTeamMember && (
            <TasksBoard 
                initiativeId={initiative.id} 
                tasks={tasks}
                teamMembers={teamMembers.map(m => m.user)}
                isOwner={isOwner}
                isTeamMember={isTeamMember}
                onDataChange={onDataChange}
                className="animate-fadeIn"
            />
        )}
        {activeTab === 'requests' && isOwner && (
          <div className="animate-fadeIn">
            {isLoadingRequests ? (
              <div className="space-y-4">
                  <JoinRequestSkeleton />
                  <JoinRequestSkeleton />
              </div>
            ) :
            joinRequests.length === 0 ? 
              <Card className="text-center p-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No Join Requests</h3>
                <p className="mt-1 text-sm text-muted-foreground">No one has requested to join this initiative yet.</p>
              </Card> :
            <div className="space-y-4">
              {joinRequests.map(request => {
                const requester = users.find(u => u.id === request.userId);
                if (!requester) return null;

                const getStatusChip = (status: JoinRequestStatus) => {
                  switch(status) {
                    case 'Approved': return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Approved</span>;
                    case 'Rejected': return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Rejected</span>;
                    default: return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">Pending</span>;
                  }
                }

                return (
                  <Card key={request.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={requester.avatarUrl} alt={requester.name} className="h-12 w-12 rounded-full" />
                        <div>
                          <p className="font-semibold text-foreground">{requester.name}</p>
                          <p className="text-sm text-muted-foreground">{requester.role} | Requested on {formatDate(request.createdAt)}</p>
                           {request.committedHours && (
                              <p className="text-sm font-semibold text-primary mt-1">{request.committedHours} hours / week commitment</p>
                           )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getStatusChip(request.status)}</div>
                    </div>
                    {(isOwner || currentUser.id === requester.id) && (
                      <div className="mt-4 sm:pl-16">
                        <p className="text-sm text-foreground bg-muted p-4 rounded-md">{request.message}</p>
                        {isOwner && request.status === 'Pending' && (
                          <div className="mt-4 flex gap-3">
                            <Button onClick={() => handleApprove(request.id)}>
                              <CheckCircle className="h-5 w-5 mr-2 -ml-1" /> Approve
                            </Button>
                            <Button variant="secondary" onClick={() => handleReject(request.id)}>
                              <XCircle className="h-5 w-5 mr-2 -ml-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          }
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default InitiativeDetail;