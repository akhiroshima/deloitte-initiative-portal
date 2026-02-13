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
}

export type InitiativeStatus = 'Searching Talent' | 'In Progress' | 'Under Review' | 'Completed';

export interface Initiative {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  /** Populated when initiative is loaded with owner join; required when creating. */
  owner?: User;
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
  createdAt?: string;
  /** Populated when loaded with assignee join */
  user?: User;
  /** Populated when loaded with initiative join */
  initiative?: Initiative;
}

export interface HelpWanted {
  id: string;
  initiativeId: string;
  skill: string;
  hoursPerWeek: number;
  status: 'Open' | 'Closed';
  /** Populated when loaded with initiative join */
  initiative?: Initiative;
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
  /** Populated when loaded with user join */
  user?: User;
  /** Populated when loaded with initiative join */
  initiative?: Initiative;
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