

import { INITIATIVES, USERS, CURRENT_USER_ID as INITIAL_CURRENT_USER_ID, HELP_WANTED_POSTS, JOIN_REQUESTS, TASKS } from '../constants';
import { Initiative, User, HelpWanted, InitiativeStatus, JoinRequest, JoinRequestStatus, Notification, NotificationType, Task, TaskStatus } from '../types';

// In-memory data store to simulate a database for the session
let memoryInitiatives: Initiative[] = JSON.parse(JSON.stringify(INITIATIVES));
let memoryHelpWanted: HelpWanted[] = JSON.parse(JSON.stringify(HELP_WANTED_POSTS));
let memoryUsers: User[] = JSON.parse(JSON.stringify(USERS));
let memoryJoinRequests: JoinRequest[] = JSON.parse(JSON.stringify(JOIN_REQUESTS));
let memoryTasks: Task[] = JSON.parse(JSON.stringify(TASKS));
let memoryNotifications: Notification[] = [];

let currentUserId: string = INITIAL_CURRENT_USER_ID;

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Notification Helper ---
const generateNotification = (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
        ...data,
        id: `notif-${Date.now()}-${Math.random()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    memoryNotifications.unshift(newNotification);
};

export const setCurrentUserId = (userId: string) => {
    const userExists = memoryUsers.some(u => u.id === userId);
    if (userExists) {
        currentUserId = userId;
    } else {
        console.warn(`Attempted to switch to non-existent user ID: ${userId}`);
    }
};

export const getInitiatives = async (): Promise<Initiative[]> => {
  await simulateDelay(200);
  return JSON.parse(JSON.stringify(memoryInitiatives));
};

export const getHelpWantedPosts = async (): Promise<HelpWanted[]> => {
  await simulateDelay(200);
  return JSON.parse(JSON.stringify(memoryHelpWanted));
}

export const getAllJoinRequests = async (): Promise<JoinRequest[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(memoryJoinRequests));
}

export const getCurrentUser = async (): Promise<User> => {
  await simulateDelay(50);
  const user = memoryUsers.find(u => u.id === currentUserId);
  if (!user) throw new Error('Current user not found');
  return JSON.parse(JSON.stringify(user));
};

export const getUsers = async (): Promise<User[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(memoryUsers));
}

export const getUserById = async (id: string): Promise<User | undefined> => {
  await simulateDelay(50);
  return memoryUsers.find(u => u.id === id);
}

export const getInitiativeById = async (id: string): Promise<Initiative | undefined> => {
    await simulateDelay(50);
    return memoryInitiatives.find(i => i.id === id);
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

    const newInitiative: Initiative = {
        ...restOfData,
        id: `init-${Date.now()}`,
        ownerId: creatingUser.id,
        teamMembers: [{ userId: creatingUser.id, committedHours: 5 }], // Owner added with default 5 hours
        status: 'Searching Talent',
        startDate: new Date().toISOString().split('T')[0],
        coverImageUrl: finalCoverImageUrl,
    };
    memoryInitiatives.unshift(newInitiative);
    
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

    const newPost: HelpWanted = {
        ...data,
        id: `hw-${Date.now()}`,
        status: 'Open'
    }
    memoryHelpWanted.unshift(newPost);
    
    const teamMemberIds = initiative.teamMembers.map(m => m.userId);
    const relevantUsers = memoryUsers.filter(user => 
        !teamMemberIds.includes(user.id) &&
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
    const initiative = memoryInitiatives.find(i => i.id === initiativeId);
    if (initiative) {
        initiative.status = status;
        if (status === 'Completed') {
            initiative.endDate = new Date().toISOString().split('T')[0];
        }
    }
    return initiative;
}

export const deleteInitiative = async (initiativeId: string): Promise<void> => {
    await simulateDelay(500);
    const initiativeIndex = memoryInitiatives.findIndex(i => i.id === initiativeId);
    if (initiativeIndex === -1) throw new Error("Initiative not found");
    
    const initiative = memoryInitiatives[initiativeIndex];
    if (initiative.ownerId !== currentUserId) throw new Error("Only the owner can delete this initiative");

    // Cascade delete related items
    memoryTasks = memoryTasks.filter(t => t.initiativeId !== initiativeId);
    memoryHelpWanted = memoryHelpWanted.filter(p => p.initiativeId !== initiativeId);
    memoryJoinRequests = memoryJoinRequests.filter(r => r.initiativeId !== initiativeId);
    memoryNotifications = memoryNotifications.filter(n => n.initiativeId !== initiativeId);

    // Delete the initiative
    memoryInitiatives.splice(initiativeIndex, 1);
};


// --- Join Request API ---

export const getJoinRequestsForInitiative = async (initiativeId: string): Promise<JoinRequest[]> => {
    await simulateDelay(150);
    return JSON.parse(JSON.stringify(memoryJoinRequests.filter(req => req.initiativeId === initiativeId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
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

    const newRequest: JoinRequest = {
        ...data,
        id: `req-${Date.now()}`,
        status: JoinRequestStatus.Pending,
        createdAt: new Date().toISOString(),
    };
    memoryJoinRequests.unshift(newRequest);
    
    generateNotification({
        userId: initiative.ownerId,
        type: NotificationType.REQUEST_RECEIVED,
        message: `${requester.name} requested to join '${initiative.title}'.`,
        link: { initiativeId: initiative.id, tab: 'requests' },
        initiativeId: initiative.id,
    });

    return newRequest;
};

export const approveJoinRequest = async (requestId: string): Promise<void> => {
    await simulateDelay(400);
    const request = memoryJoinRequests.find(r => r.id === requestId);
    if (!request || request.status !== JoinRequestStatus.Pending) {
        throw new Error('Request not found or already actioned.');
    }
    const initiative = memoryInitiatives.find(i => i.id === request.initiativeId);
    const user = await getUserById(request.userId);

    if (!initiative || !user) {
        throw new Error('Initiative or User not found.');
    }

    if (!initiative.teamMembers.some(m => m.userId === request.userId)) {
        initiative.teamMembers.push({
            userId: request.userId,
            committedHours: request.committedHours || 5 // Default to 5 if not specified
        });
    }
    
    request.status = JoinRequestStatus.Approved;

    generateNotification({
        userId: user.id,
        type: NotificationType.REQUEST_APPROVED,
        message: `Your request to join '${initiative.title}' has been approved.`,
        link: { initiativeId: initiative.id },
        initiativeId: initiative.id,
    });
};

export const rejectJoinRequest = async (requestId: string): Promise<void> => {
    await simulateDelay(400);
    const request = memoryJoinRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'Pending') throw new Error('Request not found or not pending');

    const initiative = await getInitiativeById(request.initiativeId);
    request.status = JoinRequestStatus.Rejected;
    
    if (initiative) {
        generateNotification({
            userId: request.userId,
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
    const initiative = memoryInitiatives.find(i => i.id === initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const member = initiative.teamMembers.find(m => m.userId === userId);
    if (!member) throw new Error("Team member not found");

    member.committedHours = newHours;
};


// --- Notification API ---
export const getNotificationsForUser = async(userId: string): Promise<Notification[]> => {
    await simulateDelay(150);
    return JSON.parse(JSON.stringify(memoryNotifications.filter(n => n.userId === userId)));
}

export const markNotificationAsRead = async(notificationId: string): Promise<void> => {
    await simulateDelay(50);
    const notif = memoryNotifications.find(n => n.id === notificationId);
    if(notif) notif.isRead = true;
}

export const markAllNotificationsAsRead = async(userId: string): Promise<void> => {
    await simulateDelay(100);
    memoryNotifications.forEach(n => {
        if(n.userId === userId) {
            n.isRead = true;
        }
    });
}

// --- Task API ---
export const getAllTasks = async (): Promise<Task[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(memoryTasks));
};

export type CreateTaskData = Omit<Task, 'id' | 'status'>;

export const createTask = async (data: CreateTaskData): Promise<Task> => {
    await simulateDelay(300);
    const initiative = await getInitiativeById(data.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const newTask: Task = {
        ...data,
        id: `task-${Date.now()}`,
        status: TaskStatus.Todo,
    };
    memoryTasks.unshift(newTask);

    if (data.assigneeId && data.assigneeId !== currentUserId) {
         generateNotification({
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
    const taskIndex = memoryTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");
    
    const originalTask = { ...memoryTasks[taskIndex] };
    Object.assign(memoryTasks[taskIndex], updates);
    const updatedTask = memoryTasks[taskIndex];

    // Notify on assignment change
    if (updates.assigneeId && updates.assigneeId !== originalTask.assigneeId && updates.assigneeId !== currentUserId) {
        const initiative = await getInitiativeById(updatedTask.initiativeId);
        if (initiative) {
            generateNotification({
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
    const userIndex = memoryUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    const updatedUser = { ...memoryUsers[userIndex], ...data };
    memoryUsers[userIndex] = updatedUser;
    
    return JSON.parse(JSON.stringify(updatedUser));
};

// --- Dashboard API ---
export const getDashboardData = async () => {
    await simulateDelay(500);
    const initiatives = memoryInitiatives;
    const users = memoryUsers;

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