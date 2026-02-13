import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Initiative, User, HelpWanted, JoinRequest, Notification, Task } from '../types';
import * as api from '../services/api';

interface DataContextValue {
  initiatives: Initiative[];
  helpWanted: HelpWanted[];
  users: User[];
  tasks: Task[];
  joinRequests: JoinRequest[];
  notifications: Notification[];
  loading: boolean;
  networkError: boolean;
  isLoadingData: boolean;
  refreshData: (user?: User) => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string | null;
}) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [helpWanted, setHelpWanted] = useState<HelpWanted[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const isMountedRef = useRef(true);

  const refreshData = useCallback(
    async (user?: User) => {
      const userToUse = user ?? (currentUserId ? ({ id: currentUserId } as User) : null);
      if (!userToUse?.id) return;
      if (isLoadingData) return;
      try {
        setIsLoadingData(true);
        setNetworkError(false);
        const [initiativesData, helpWantedData, usersData, joinRequestsData, tasksData, notificationsData] =
          await Promise.all([
            api.getInitiatives(),
            api.getHelpWantedPosts(),
            api.getUsers(),
            api.getAllJoinRequests(),
            api.getAllTasks(),
            api.getNotificationsForUser(userToUse.id),
          ]);
        if (!isMountedRef.current) return;
        setInitiatives(initiativesData);
        setHelpWanted(helpWantedData);
        setUsers(usersData);
        setJoinRequests(joinRequestsData);
        setTasks(tasksData);
        setNotifications(
          notificationsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      } catch (error) {
        console.error('Failed to fetch app data:', error);
        if (isMountedRef.current) setNetworkError(true);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsLoadingData(false);
        }
      }
    },
    [currentUserId, isLoadingData]
  );

  useEffect(() => {
    if (currentUserId) {
      setLoading(true);
      refreshData();
    } else {
      setLoading(false);
    }
  }, [currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps -- only run when user id changes

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const value: DataContextValue = {
    initiatives,
    helpWanted,
    users,
    tasks,
    joinRequests,
    notifications,
    loading,
    networkError,
    isLoadingData,
    refreshData,
    setNotifications,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
