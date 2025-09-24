
import { Initiative, User, HelpWanted, InitiativeStatus, JoinRequest, JoinRequestStatus, Notification, NotificationType, Task, TaskStatus } from '../types';
import * as db from './database';

// Current user state
let currentUserId: string | null = null;

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  await simulateDelay(200);
  return await db.getAllInitiatives();
};

export const getHelpWantedPosts = async (): Promise<HelpWanted[]> => {
  await simulateDelay(200);
  return await db.getAllHelpWanted();
}

export const getAllJoinRequests = async (): Promise<JoinRequest[]> => {
    await simulateDelay(100);
    return await db.getAllJoinRequests();
}

// getCurrentUser moved above

export const getUsers = async (): Promise<User[]> => {
    await simulateDelay(100);
    return await db.getAllUsers();
}

export const getUserById = async (id: string): Promise<User | undefined> => {
  await simulateDelay(50);
  const user = await db.getUserById(id);
  return user || undefined;
}

export const getInitiativeById = async (id: string): Promise<Initiative | undefined> => {
    await simulateDelay(50);
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
    await simulateDelay(400);
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
    await simulateDelay(300);
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
    await simulateDelay(200);
    const postIndex = memoryHelpWanted.findIndex(p => p.id === postId);
    if (postIndex === -1) throw new Error("Help wanted post not found");
    
    const updatedPost = { ...memoryHelpWanted[postIndex], ...data };
    memoryHelpWanted[postIndex] = updatedPost;
    return JSON.parse(JSON.stringify(updatedPost));
};

export const deleteHelpWantedPost = async (postId: string): Promise<void> => {
    await simulateDelay(300);
    const initialLength = memoryHelpWanted.length;
    memoryHelpWanted = memoryHelpWanted.filter(p => p.id !== postId);
    if (memoryHelpWanted.length === initialLength) {
        throw new Error("Help wanted post not found");
    }
};

export const updateInitiativeStatus = async (initiativeId: string, status: InitiativeStatus): Promise<Initiative | undefined> => {
    await simulateDelay(300);
    const initiative = await db.getInitiativeById(initiativeId);
    if (initiative) {
        const updateData: any = { status };
        if (status === 'Completed') {
            updateData.endDate = new Date().toISOString().split('T')[0];
        }
        const updatedInitiative = await db.updateInitiative(initiativeId, updateData);
        return updatedInitiative;
    }
    return undefined;
}

export const deleteInitiative = async (initiativeId: string): Promise<void> => {
    await simulateDelay(500);
    
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
    await simulateDelay(150);
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
    await simulateDelay(300);
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
    await simulateDelay(400);
    const updatedRequest = await db.updateJoinRequest(requestId, 'Approved');
    if (!updatedRequest) {
        throw new Error('Request not found or already actioned.');
    }
    
    const initiative = await getInitiativeById(updatedRequest.initiativeId);
    const user = await getUserById(updatedRequest.userId);

    if (!initiative || !user) {
        throw new Error('Initiative or User not found.');
    }

    // Note: Team member management would need to be implemented in the database
    // For now, we'll just update the request status

    await generateNotification({
        userId: user.id,
        type: NotificationType.REQUEST_APPROVED,
        message: `Your request to join '${initiative.title}' has been approved.`,
        link: { initiativeId: initiative.id },
        initiativeId: initiative.id,
    });
};

export const rejectJoinRequest = async (requestId: string): Promise<void> => {
    await simulateDelay(400);
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
    await simulateDelay(300);
    const requestIndex = memoryJoinRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) throw new Error("Request not found");

    const request = memoryJoinRequests[requestIndex];
    if (request.userId !== currentUserId) throw new Error("You can only cancel your own requests.");
    if (request.status !== JoinRequestStatus.Pending) throw new Error("Only pending requests can be cancelled.");

    memoryJoinRequests.splice(requestIndex, 1);
};


export const inviteUserToInitiative = async (initiativeId: string, inviteeId: string, inviterId: string): Promise<JoinRequest> => {
    await simulateDelay(300);
    const initiative = await getInitiativeById(initiativeId);
    const invitee = await getUserById(inviteeId);
    const inviter = await getUserById(inviterId);

    if (!initiative || !invitee || !inviter) throw new Error("Data not found");
    if (initiative.teamMembers.some(m => m.userId === inviteeId)) throw new Error("User is already on the team");

    const newInvite: JoinRequest = {
        id: `req-${Date.now()}`,
        initiativeId,
        userId: inviteeId,
        message: `${inviter.name} has invited you to join this project.`,
        status: JoinRequestStatus.Invited,
        createdAt: new Date().toISOString(),
    };
    memoryJoinRequests.unshift(newInvite);

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
    await simulateDelay(400);
    const requestIndex = memoryJoinRequests.findIndex(r => r.id === requestId);
    const request = memoryJoinRequests[requestIndex];

    if (!request || request.status !== JoinRequestStatus.Invited) {
        throw new Error("Invitation not found or not valid.");
    }
    const initiative = memoryInitiatives.find(i => i.id === request.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    if (!initiative.teamMembers.some(m => m.userId === request.userId)) {
        initiative.teamMembers.push({ userId: request.userId, committedHours });
    }
    
    memoryJoinRequests.splice(requestIndex, 1); // Remove the invitation

    generateNotification({
        userId: initiative.ownerId,
        type: NotificationType.REQUEST_APPROVED, // Can reuse this type
        message: `${(await getUserById(request.userId))?.name} has accepted your invite to join '${initiative.title}'.`,
        link: { initiativeId: initiative.id },
        initiativeId: initiative.id,
    });
};

export const declineInvite = async (requestId: string): Promise<void> => {
    await simulateDelay(200);
    const requestIndex = memoryJoinRequests.findIndex(r => r.id === requestId);
    const request = memoryJoinRequests[requestIndex];
    if (!request) return; // Fail silently if not found

    const initiative = await getInitiativeById(request.initiativeId);
    
    memoryJoinRequests.splice(requestIndex, 1);

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
    await simulateDelay(200);
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
    await simulateDelay(150);
    return await db.getNotificationsForUser(userId);
}

export const markNotificationAsRead = async(notificationId: string): Promise<void> => {
    await simulateDelay(50);
    await db.markNotificationAsRead(notificationId);
}

export const markAllNotificationsAsRead = async(userId: string): Promise<void> => {
    await simulateDelay(100);
    await db.markAllNotificationsAsRead(userId);
}

// --- Task API ---
export const getAllTasks = async (): Promise<Task[]> => {
    await simulateDelay(100);
    return await db.getAllTasks();
}

export type CreateTaskData = Omit<Task, 'id' | 'status'>;

export const createTask = async (data: CreateTaskData): Promise<Task> => {
    await simulateDelay(300);
    const initiative = await getInitiativeById(data.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const newTaskData: Omit<Task, 'id'> = {
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
    await simulateDelay(200);
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
    await simulateDelay(200);

    if (updatedTasks.length === 0) {
        // This can happen if an initiative has no tasks.
        // If there were tasks before, we need to handle their removal.
        const firstTask = memoryTasks.find(t => t.initiativeId === updatedTasks[0]?.initiativeId);
        if(!firstTask) return; // No tasks for this initiative existed before, nothing to do.
    }
    
    // The component sends a list of tasks for a single initiative.
    // We need to merge this into our master list.
    const initiativeIdToUpdate = updatedTasks[0]?.initiativeId || memoryTasks.find(t => !updatedTasks.some(ut => ut.id === t.id))?.initiativeId;

    if (!initiativeIdToUpdate) {
        // Can't determine which initiative to update, so we can't proceed.
        return;
    }

    // All tasks that are NOT part of the initiative being updated.
    const otherTasks = memoryTasks.filter(t => t.initiativeId !== initiativeIdToUpdate);

    // The new full list of tasks is the other tasks plus the updated tasks for the current initiative.
    const newMasterTaskList = [...otherTasks, ...updatedTasks];

    // The check was failing because it was comparing a partial list to the full list.
    // This new approach ensures we're always working with a complete task list for the update.
    // The set of task IDs should remain the same before and after a reorder/status change operation.
    if (newMasterTaskList.map(t => t.id).sort().join(',') !== memoryTasks.map(t => t.id).sort().join(',')) {
        console.error("Task list mismatch during update. Aborting.");
        throw new Error("Task list mismatch during update. The set of tasks being saved is different from the original set.");
    }
    
    memoryTasks = JSON.parse(JSON.stringify(newMasterTaskList));
};


export const deleteTask = async (taskId: string): Promise<void> => {
    await simulateDelay(300);
    const taskIndex = memoryTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");

    memoryTasks.splice(taskIndex, 1);
};


// --- User Profile API ---
export const updateUserProfile = async (userId: string, data: Partial<Pick<User, 'skills' | 'location' | 'weeklyCapacityHrs'>>): Promise<User> => {
    await simulateDelay(300);
    const updatedUser = await db.updateUser(userId, data);
    if (!updatedUser) throw new Error("User not found");
    
    return updatedUser;
};

// --- Dashboard API ---
export const getDashboardData = async () => {
    await simulateDelay(500);
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