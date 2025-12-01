import { Initiative, User, HelpWanted, InitiativeStatus, JoinRequest, JoinRequestStatus, Notification, NotificationType, Task, TaskStatus } from '../types';
import * as db from './database';
import { supabase } from './supabase';

// Current user state
let currentUserId: string | null = null;

// --- Notification Helper ---
const generateNotification = async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    await db.createNotification({
        ...data,
        isRead: false,
    });
};

// Set current user ID (used by auth system)
export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!currentUserId) return null;
  return await db.getUserById(currentUserId);
};

export const getInitiatives = async (): Promise<Initiative[]> => {
  return await db.getAllInitiatives();
};

export const getHelpWantedPosts = async (): Promise<HelpWanted[]> => {
  return await db.getAllHelpWanted();
}

export const getAllJoinRequests = async (): Promise<JoinRequest[]> => {
    return await db.getAllJoinRequests();
}

export const getUsers = async (): Promise<User[]> => {
    return await db.getAllUsers();
}

export const getUserById = async (id: string): Promise<User | undefined> => {
  const user = await db.getUserById(id);
  return user || undefined;
}

export const getInitiativeById = async (id: string): Promise<Initiative | undefined> => {
    const initiative = await db.getInitiativeById(id);
    return initiative || undefined;
}

export type CreateInitiativeData = Omit<Initiative, 'id' | 'ownerId' | 'status' | 'startDate' | 'endDate' | 'coverImageUrl' | 'teamMembers'> & {
    coverImageFile?: File;
    teamMemberIds: string[];
};

const getRandomCoverImage = (_tags: string[]): string => {
    const seed = Date.now();
    return `https://picsum.photos/seed/${seed}/1600/900`;
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
});


export const createInitiative = async (data: CreateInitiativeData): Promise<Initiative> => {
    const creatingUser = await getCurrentUser();
    if (!creatingUser) throw new Error("No current user found");

    const { coverImageFile, teamMemberIds, ...restOfData } = data;

    let finalCoverImageUrl: string;
    if (coverImageFile) {
        finalCoverImageUrl = await fileToBase64(coverImageFile);
    } else {
        finalCoverImageUrl = getRandomCoverImage(data.tags);
    }

    const newInitiativeData: Omit<Initiative, 'id'> = {
        ...restOfData,
        owner: creatingUser,
        status: 'Searching Talent',
        startDate: new Date().toISOString().split('T')[0],
        coverImageUrl: finalCoverImageUrl,
    };

    const newInitiative = await db.createInitiative(newInitiativeData);
    if (!newInitiative) throw new Error("Failed to create initiative");
    
    // Invite other members
    teamMemberIds.forEach(userId => {
        if (userId !== creatingUser.id) {
            inviteUserToInitiative(newInitiative.id, userId, creatingUser.id);
        }
    });

    return newInitiative;
}

export type CreateHelpWantedData = Omit<HelpWanted, 'id' | 'status'>;

export const createHelpWantedPost = async(data: CreateHelpWantedData): Promise<HelpWanted> => {
    const initiative = await getInitiativeById(data.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const newPostData: Omit<HelpWanted, 'id'> = {
        ...data,
        status: 'Open'
    }
    
    const newPost = await db.createHelpWanted(newPostData);
    if (!newPost) throw new Error("Failed to create help wanted post");
    
    // Get all users to find relevant ones for notifications
    const allUsers = await getUsers();
    const relevantUsers = allUsers.filter(user => 
        user.skills.includes(newPost.skill)
    );

    relevantUsers.forEach(user => {
        generateNotification({
            userId: user.id,
            type: NotificationType.NEW_OPPORTUNITY,
            message: `A new role for a '${newPost.skill}' is open on '${initiative.title}'.`,
            link: { initiativeId: initiative.id },
            initiativeId: initiative.id,
        });
    });

    return newPost;
}

export const updateHelpWantedPost = async (postId: string, data: Partial<Omit<HelpWanted, 'id' | 'initiativeId'>>): Promise<HelpWanted> => {
    const updatedPost = await db.updateHelpWanted(postId, data);
    if (!updatedPost) throw new Error("Help wanted post not found");
    return updatedPost;
};

export const deleteHelpWantedPost = async (postId: string): Promise<void> => {
    const success = await db.deleteHelpWanted(postId);
    if (!success) throw new Error("Help wanted post not found or failed to delete");
};

export const updateInitiativeStatus = async (initiativeId: string, status: InitiativeStatus): Promise<Initiative | undefined> => {
    const initiative = await db.getInitiativeById(initiativeId);
    if (initiative) {
        const updateData: any = { status };
        if (status === 'Completed') {
            updateData.endDate = new Date().toISOString().split('T')[0];
        }
        const updatedInitiative = await db.updateInitiative(initiativeId, updateData);
        return updatedInitiative || undefined;
    }
    return undefined;
}

export const deleteInitiative = async (initiativeId: string): Promise<void> => {
    // Get the initiative to check ownership
    const initiative = await db.getInitiativeById(initiativeId);
    if (!initiative) throw new Error("Initiative not found");
    
    if (initiative.ownerId !== currentUserId) throw new Error("Only the owner can delete this initiative");

    // Delete the initiative (cascade delete will handle related items)
    const success = await db.deleteInitiative(initiativeId);
    if (!success) throw new Error("Failed to delete initiative");
};


// --- Join Request API ---

export const getJoinRequestsForInitiative = async (initiativeId: string): Promise<JoinRequest[]> => {
    return await db.getJoinRequestsForInitiative(initiativeId);
};

export interface CreateJoinRequestData {
    initiativeId: string;
    userId: string;
    message: string;
    committedHours: number;
    helpWantedId?: string;
}

export const createJoinRequest = async (data: CreateJoinRequestData): Promise<JoinRequest> => {
    const initiative = await getInitiativeById(data.initiativeId);
    const requester = await getUserById(data.userId);

    if (!initiative || !requester) throw new Error("Initiative or User not found");

    const newRequestData: Omit<JoinRequest, 'id' | 'createdAt'> = {
        ...data,
        status: JoinRequestStatus.Pending,
    };
    
    const newRequest = await db.createJoinRequest(newRequestData);
    if (!newRequest) throw new Error("Failed to create join request");
    
    await generateNotification({
        userId: initiative.owner.id,
        type: NotificationType.REQUEST_RECEIVED,
        message: `${requester.name} requested to join '${initiative.title}'.`,
        link: { initiativeId: initiative.id, tab: 'requests' },
        initiativeId: initiative.id,
    });

    return newRequest;
};

export const approveJoinRequest = async (requestId: string): Promise<void> => {
    const updatedRequest = await db.updateJoinRequest(requestId, 'Approved');
    if (!updatedRequest) {
        throw new Error('Request not found or already actioned.');
    }
    
    const initiative = await getInitiativeById(updatedRequest.initiativeId);
    const user = await getUserById(updatedRequest.userId);

    if (!initiative || !user) {
        throw new Error('Initiative or User not found.');
    }

    // Add user to team members
    const { error } = await supabase
      .from('initiative_team_members')
      .insert({
        initiative_id: initiative.id,
        user_id: user.id,
        committed_hours: 0 // Default, as join_requests doesn't track this yet
      });

    if (error) {
        console.error("Failed to add team member:", error);
        // Don't throw, as the request is already approved. Just log it.
        // Ideally we should transaction this.
    }

    await generateNotification({
        userId: user.id,
        type: NotificationType.REQUEST_APPROVED,
        message: `Your request to join '${initiative.title}' has been approved.`,
        link: { initiativeId: initiative.id },
        initiativeId: initiative.id,
    });
};

export const rejectJoinRequest = async (requestId: string): Promise<void> => {
    const updatedRequest = await db.updateJoinRequest(requestId, 'Rejected');
    if (!updatedRequest) {
        throw new Error('Request not found or not pending');
    }

    const initiative = await getInitiativeById(updatedRequest.initiativeId);
    
    if (initiative) {
        await generateNotification({
            userId: updatedRequest.userId,
            type: NotificationType.REQUEST_REJECTED,
            message: `Your request to join '${initiative.title}' was not approved at this time.`,
            link: { initiativeId: initiative.id },
            initiativeId: initiative.id,
        });
    }
};

export const cancelJoinRequest = async (requestId: string): Promise<void> => {
    // We can use deleteJoinRequest for cancellation
    const success = await db.deleteJoinRequest(requestId);
    if (!success) throw new Error("Request not found or failed to cancel");
};


export const inviteUserToInitiative = async (initiativeId: string, inviteeId: string, inviterId: string): Promise<JoinRequest> => {
    const initiative = await getInitiativeById(initiativeId);
    const invitee = await getUserById(inviteeId);
    const inviter = await getUserById(inviterId);

    if (!initiative || !invitee || !inviter) throw new Error("Data not found");
    if (initiative.teamMembers.some(m => m.userId === inviteeId)) throw new Error("User is already on the team");

    const newInviteData: Omit<JoinRequest, 'id' | 'createdAt'> = {
        initiativeId,
        userId: inviteeId,
        message: `${inviter.name} has invited you to join this project.`,
        status: JoinRequestStatus.Invited,
    };
    
    const newInvite = await db.createJoinRequest(newInviteData);
    if (!newInvite) throw new Error("Failed to invite user");

    generateNotification({
        userId: inviteeId,
        type: NotificationType.INVITED_TO_PROJECT,
        message: `${inviter.name} has invited you to join '${initiative.title}'.`,
        link: { initiativeId, view: 'workspace' },
        initiativeId: initiative.id,
    });

    return newInvite;
};

export const acceptInvite = async (requestId: string, committedHours: number): Promise<void> => {
    // Get the join request from database
    const joinRequests = await db.getAllJoinRequests();
    const request = joinRequests.find(r => r.id === requestId);
    
    if (!request || request.status !== JoinRequestStatus.Invited) {
        throw new Error("Invitation not found or not valid.");
    }
    
    const initiative = await db.getInitiativeById(request.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    // Add user to team members in database
    // Use raw supabase call for now as db helper might not exist for this specific operation
    // Or better, update database.ts to include addTeamMember
    // For now, mirroring existing logic which uses supabase directly
    const { error } = await supabase
      .from('initiative_team_members')
      .insert({
        initiative_id: request.initiativeId,
        user_id: request.userId,
        committed_hours: committedHours
      });
      
    if (error) throw error;
    
    // Remove the invitation from database
    await db.deleteJoinRequest(requestId);

    generateNotification({
        userId: initiative.ownerId,
        type: NotificationType.REQUEST_APPROVED, // Can reuse this type
        message: `${(await getUserById(request.userId))?.name} has accepted your invite to join '${initiative.title}'.`,
        link: { initiativeId: initiative.id },
        initiativeId: initiative.id,
    });
};

export const declineInvite = async (requestId: string): Promise<void> => {
    // Get request details before deleting for notification
    const joinRequests = await db.getAllJoinRequests();
    const request = joinRequests.find(r => r.id === requestId);
    
    if (!request) return;

    const initiative = await getInitiativeById(request.initiativeId);
    
    await db.deleteJoinRequest(requestId);

     if (initiative) {
        generateNotification({
            userId: initiative.ownerId,
            type: NotificationType.REQUEST_REJECTED,
            message: `${(await getUserById(request.userId))?.name} declined the invitation to join '${initiative.title}'.`,
            link: { initiativeId: initiative.id, tab: 'overview' },
            initiativeId: initiative.id,
        });
    }
};

export const updateCommitment = async (initiativeId: string, userId: string, newHours: number): Promise<void> => {
    const initiative = await db.getInitiativeById(initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const member = initiative.teamMembers.find(m => m.userId === userId);
    if (!member) throw new Error("Team member not found");

    // Update the team member's committed hours
    const updatedTeamMembers = initiative.teamMembers.map(m => 
        m.userId === userId ? { ...m, committedHours: newHours } : m
    );
    
    await db.updateInitiative(initiativeId, { teamMembers: updatedTeamMembers });
};


// --- Notification API ---
export const getNotificationsForUser = async(userId: string): Promise<Notification[]> => {
    return await db.getNotificationsForUser(userId);
}

export const markNotificationAsRead = async(notificationId: string): Promise<void> => {
    await db.markNotificationAsRead(notificationId);
}

export const markAllNotificationsAsRead = async(userId: string): Promise<void> => {
    await db.markAllNotificationsAsRead(userId);
}

// --- Task API ---
export const getAllTasks = async (): Promise<Task[]> => {
    return await db.getAllTasks();
}

export const createTask = async (data: CreateTaskData): Promise<Task> => {
    const initiative = await getInitiativeById(data.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const newTaskData: Omit<Task, 'id' | 'createdAt'> = {
        ...data,
        status: TaskStatus.Todo,
    };
    
    const newTask = await db.createTask(newTaskData);
    if (!newTask) throw new Error("Failed to create task");

    if (data.assigneeId && data.assigneeId !== currentUserId) {
         await generateNotification({
            userId: data.assigneeId,
            type: NotificationType.TASK_ASSIGNED,
            message: `You have been assigned a new task: '${newTask.title}' on '${initiative.title}'.`,
            link: { initiativeId: initiative.id, tab: 'tasks' },
            initiativeId: initiative.id,
        });
    }

    return newTask;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const updatedTask = await db.updateTask(taskId, updates);
    if (!updatedTask) throw new Error("Task not found");

    // Notify on assignment change
    if (updates.assigneeId && updates.assigneeId !== currentUserId) {
        const initiative = await getInitiativeById(updatedTask.initiativeId);
        if (initiative) {
            await generateNotification({
                userId: updates.assigneeId,
                type: NotificationType.TASK_ASSIGNED,
                message: `You have been assigned a task: '${updatedTask.title}' on '${initiative.title}'.`,
                link: { initiativeId: initiative.id, tab: 'tasks' },
                initiativeId: initiative.id,
            });
        }
    }

    return updatedTask;
}

export const updateTasks = async (updatedTasks: Task[]): Promise<void> => {
    if (updatedTasks.length === 0) return;
    
    // Process updates in parallel
    await Promise.all(updatedTasks.map(task => db.updateTask(task.id, task)));
};


export const deleteTask = async (taskId: string): Promise<void> => {
    const success = await db.deleteTask(taskId);
    if (!success) throw new Error("Failed to delete task");
};


// --- User Profile API ---
export const updateUserProfile = async (userId: string, data: Partial<Pick<User, 'skills' | 'location' | 'weeklyCapacityHrs'>>): Promise<User> => {
    const updatedUser = await db.updateUser(userId, data);
    if (!updatedUser) throw new Error("User not found");
    
    return updatedUser;
};

// --- Dashboard API ---
export const getDashboardData = async () => {
    const initiatives = await db.getAllInitiatives();
    const users = await db.getAllUsers();

    const activeInitiatives = initiatives.filter(i => i.status === 'In Progress').length;
    
    const now = new Date();
    const q2Start = new Date(now.getFullYear(), 3, 1);
    const q2End = new Date(now.getFullYear(), 5, 30);
    const completedInQ2 = initiatives.filter(i => {
        if (i.status !== 'Completed' || !i.endDate) return false;
        const endDate = new Date(i.endDate);
        return endDate >= q2Start && endDate <= q2End;
    }).length;

    const completedWithDates = initiatives.filter(i => i.status === 'Completed' && i.startDate && i.endDate);
    const totalCycleTime = completedWithDates.reduce((sum, i) => {
        const start = new Date(i.startDate!).getTime();
        const end = new Date(i.endDate!).getTime();
        const diffDays = (end - start) / (1000 * 3600 * 24);
        return sum + diffDays;
    }, 0);
    const avgCycleTime = completedWithDates.length > 0 ? Math.round(totalCycleTime / completedWithDates.length) : 0;
    
    // New, more accurate utilization calculation
    const utilizationByUser: { [userId: string]: number } = {};
    initiatives.forEach(initiative => {
        if (initiative.status === 'In Progress' || initiative.status === 'Under Review') {
            initiative.teamMembers.forEach(member => {
                if (!utilizationByUser[member.userId]) {
                    utilizationByUser[member.userId] = 0;
                }
                utilizationByUser[member.userId] += member.committedHours;
            });
        }
    });

    const utilizationByLocation: { [key: string]: { capacity: number, assigned: number } } = {};
    users.forEach(user => {
        if (!utilizationByLocation[user.location]) {
            utilizationByLocation[user.location] = { capacity: 0, assigned: 0 };
        }
        utilizationByLocation[user.location].capacity += user.weeklyCapacityHrs;
        utilizationByLocation[user.location].assigned += utilizationByUser[user.id] || 0;
    });

    return {
        kpis: {
            active: activeInitiatives,
            completedQ2: completedInQ2,
            avgCycleTime: `${avgCycleTime} days`,
        },
        utilization: Object.entries(utilizationByLocation).map(([location, data]) => ({
            location,
            ...data,
            percentage: data.capacity > 0 ? Math.round((data.assigned / data.capacity) * 100) : 0
        })).sort((a,b) => b.capacity - a.capacity),
    };
};
