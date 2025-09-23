export enum RAGStatus {
  Green = 'Green',
  Amber = 'Amber',
  Red = 'Red',
}

export enum TaskStatus {
  Todo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'Designer' | 'Developer' | 'Lead' | 'Manager' | 'Admin';
  skills: string[];
  location: string;
  weeklyCapacityHrs: number;
  avatarUrl: string;
  isAdmin?: boolean;
  password_hash?: string;
}

export type InitiativeStatus = 'Searching Talent' | 'In Progress' | 'Under Review' | 'Completed';

export interface Initiative {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  teamMembers: { userId: string; committedHours: number }[];
  status: InitiativeStatus;
  startDate: string;
  endDate?: string;
  skillsNeeded: string[];
  locations: string[];
  tags: string[];
  coverImageUrl: string;
}

export interface Task {
  id: string;
  initiativeId: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: TaskStatus;
  dueDate?: string;
  estHrs?: number;
}

export interface HelpWanted {
  id:string;
  initiativeId: string;
  skill: string;
  hoursPerWeek: number;
  status: 'Open' | 'Closed';
}

export enum JoinRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Invited = 'Invited',
}

export interface JoinRequest {
  id: string;
  initiativeId: string;
  userId: string;
  message: string;
  status: JoinRequestStatus;
  createdAt: string;
  helpWantedId?: string;
  committedHours?: number;
}

// --- Notification System Types ---

export enum NotificationType {
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  NEW_OPPORTUNITY = 'NEW_OPPORTUNITY',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  INVITED_TO_PROJECT = 'INVITED_TO_PROJECT',
}

export interface NotificationLink {
  initiativeId: string;
  tab?: 'overview' | 'requests' | 'tasks';
  view?: 'workspace';
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  link: NotificationLink;
  isRead: boolean;
  createdAt: string;
  initiativeId: string;
}

export interface ToastNotification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

// --- AI Service Types ---
export interface RecommendedInitiative {
  initiativeId: string;
  reasoning: string;
}
export interface RecommendedHelpWanted {
  helpWantedId: string;
  reasoning: string;
}