import { Initiative, User, HelpWanted, JoinRequest, Task, Notification } from '../types';
import { supabase, isDatabaseAvailable } from './supabase';

// Users CRUD
export const createUser = async (userData: Omit<User, 'id'>): Promise<User | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('users')
      .insert({
        email: userData.email,
        username: userData.username,
        password_hash: userData.password_hash || '',
        name: userData.name,
        role: userData.role,
        is_admin: userData.isAdmin || false,
        location: userData.location,
        skills: userData.skills,
        weekly_capacity_hrs: userData.weeklyCapacityHrs,
        avatar_url: userData.avatarUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      name: data.name,
      role: data.role,
      isAdmin: data.is_admin,
      location: data.location,
      skills: data.skills,
      weeklyCapacityHrs: data.weekly_capacity_hrs,
      avatarUrl: data.avatar_url
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  if (!isDatabaseAvailable() || !id) return null;
  
  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      isAdmin: data.is_admin,
      skills: data.skills || [],
      location: data.location,
      weeklyCapacityHrs: data.weekly_capacity_hrs,
      avatarUrl: data.avatar_url
    } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isAdmin: user.is_admin,
      skills: user.skills || [],
      location: user.location,
      weeklyCapacityHrs: user.weekly_capacity_hrs,
      avatarUrl: user.avatar_url
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('users')
      .update({
        name: updates.name,
        role: updates.role,
        skills: updates.skills,
        location: updates.location,
        weekly_capacity_hrs: updates.weeklyCapacityHrs,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      isAdmin: data.is_admin,
      skills: data.skills || [],
      location: data.location,
      weeklyCapacityHrs: data.weekly_capacity_hrs,
      avatarUrl: data.avatar_url
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

// Initiatives CRUD
export const getAllInitiatives = async (): Promise<Initiative[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('initiatives')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Fetch owner data and team members for each initiative
    const initiativesWithOwners = await Promise.all(
      data.map(async (initiative) => {
        const { data: ownerData } = await supabase!
          .from('users')
          .select('*')
          .eq('id', initiative.owner_id)
          .single();
        
        // Fetch team members for this initiative
        const { data: teamMembersData } = await supabase!
          .from('initiative_team_members')
          .select('user_id, committed_hours')
          .eq('initiative_id', initiative.id);
        
        return {
          id: initiative.id,
          title: initiative.title,
          description: initiative.description,
          ownerId: initiative.owner_id,
          teamMembers: teamMembersData ? teamMembersData.map(member => ({
            userId: member.user_id,
            committedHours: member.committed_hours
          })) : [],
          status: initiative.status,
          startDate: initiative.start_date,
          endDate: initiative.end_date,
          skillsNeeded: initiative.skills_needed || [],
          locations: initiative.locations || [],
          tags: initiative.tags || [],
          coverImageUrl: initiative.cover_image_url,
          owner: ownerData ? {
            id: ownerData.id,
            name: ownerData.name,
            email: ownerData.email,
            role: ownerData.role,
            skills: ownerData.skills || [],
            location: ownerData.location,
            weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
            avatarUrl: ownerData.avatar_url
          } : null
        };
      })
    );
    
    return initiativesWithOwners;
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return [];
  }
};

export const getInitiativeById = async (id: string): Promise<Initiative | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('initiatives')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Fetch owner data
    const { data: ownerData } = await supabase!
      .from('users')
      .select('*')
      .eq('id', data.owner_id)
      .single();
    
    // Fetch team members
    const { data: teamMembersData } = await supabase!
      .from('initiative_team_members')
      .select('user_id, committed_hours')
      .eq('initiative_id', id);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      ownerId: data.owner_id,
      teamMembers: teamMembersData ? teamMembersData.map(member => ({
        userId: member.user_id,
        committedHours: member.committed_hours
      })) : [],
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url,
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        role: ownerData.role,
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url
      } : null
    };
  } catch (error) {
    console.error('Error fetching initiative:', error);
    return null;
  }
};

export const createInitiative = async (initiative: Omit<Initiative, 'id'>): Promise<Initiative | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('initiatives')
      .insert({
        id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        owner_id: initiative.owner.id,
        title: initiative.title,
        description: initiative.description,
        status: initiative.status,
        start_date: initiative.startDate,
        end_date: initiative.endDate,
        skills_needed: initiative.skillsNeeded,
        locations: initiative.locations,
        tags: initiative.tags,
        cover_image_url: initiative.coverImageUrl,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Fetch owner data
    const { data: ownerData } = await supabase!
      .from('users')
      .select('*')
      .eq('id', data.owner_id)
      .single();
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      ownerId: data.owner_id,
      teamMembers: [], // New initiatives start with empty team
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url,
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        role: ownerData.role,
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url
      } : null
    };
  } catch (error) {
    console.error('Error creating initiative:', error);
    return null;
  }
};

export const updateInitiative = async (id: string, updates: Partial<Initiative>): Promise<Initiative | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('initiatives')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        start_date: updates.startDate,
        end_date: updates.endDate,
        skills_needed: updates.skillsNeeded,
        locations: updates.locations,
        tags: updates.tags,
        cover_image_url: updates.coverImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Fetch owner data
    const { data: ownerData } = await supabase!
      .from('users')
      .select('*')
      .eq('id', data.owner_id)
      .single();
    
    // Handle team members update if provided
    if (updates.teamMembers) {
      // Delete existing team members
      await supabase!
        .from('initiative_team_members')
        .delete()
        .eq('initiative_id', id);
      
      // Insert new team members
      if (updates.teamMembers.length > 0) {
        const teamMembersToInsert = updates.teamMembers.map(member => ({
          initiative_id: id,
          user_id: member.userId,
          committed_hours: member.committedHours
        }));
        
        await supabase!
          .from('initiative_team_members')
          .insert(teamMembersToInsert);
      }
    }
    
    // Fetch current team members
    const { data: teamMembersData } = await supabase!
      .from('initiative_team_members')
      .select('user_id, committed_hours')
      .eq('initiative_id', id);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      ownerId: data.owner_id,
      teamMembers: teamMembersData ? teamMembersData.map(member => ({
        userId: member.user_id,
        committedHours: member.committed_hours
      })) : [],
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url,
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        role: ownerData.role,
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url
      } : null
    };
  } catch (error) {
    console.error('Error updating initiative:', error);
    return null;
  }
};

export const deleteInitiative = async (id: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('initiatives')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting initiative:', error);
    return false;
  }
};

// Help Wanted CRUD
export const getAllHelpWanted = async (): Promise<HelpWanted[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('help_wanted')
      .select(`
        *,
        initiative:initiatives(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(post => ({
      id: post.id,
      initiativeId: post.initiative_id,
      skill: post.skill,
      hoursPerWeek: post.hours_per_week,
      status: post.status,
      initiative: {
        id: post.initiative.id,
        title: post.initiative.title,
        description: post.initiative.description,
        status: post.initiative.status,
        startDate: post.initiative.start_date,
        endDate: post.initiative.end_date,
        skillsNeeded: post.initiative.skills_needed || [],
        locations: post.initiative.locations || [],
        tags: post.initiative.tags || [],
        coverImageUrl: post.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    }));
  } catch (error) {
    console.error('Error fetching help wanted posts:', error);
    return [];
  }
};

export const createHelpWanted = async (post: Omit<HelpWanted, 'id'>): Promise<HelpWanted | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('help_wanted')
      .insert({
        id: `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        initiative_id: post.initiativeId,
        skill: post.skill,
        hours_per_week: post.hoursPerWeek,
        status: post.status,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        initiative:initiatives(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      initiativeId: data.initiative_id,
      skill: data.skill,
      hoursPerWeek: data.hours_per_week,
      status: data.status,
      initiative: {
        id: data.initiative.id,
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    };
  } catch (error) {
    console.error('Error creating help wanted post:', error);
    return null;
  }
};

// Join Requests CRUD
export const getAllJoinRequests = async (): Promise<JoinRequest[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('join_requests')
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(request => ({
      id: request.id,
      initiativeId: request.initiative_id,
      userId: request.user_id,
      message: request.message,
      status: request.status,
      createdAt: request.created_at,
      user: {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
        role: request.user.role,
        skills: request.user.skills || [],
        location: request.user.location,
        weeklyCapacityHrs: request.user.weekly_capacity_hrs,
        avatarUrl: request.user.avatar_url
      },
      initiative: {
        id: request.initiative.id,
        title: request.initiative.title,
        description: request.initiative.description,
        status: request.initiative.status,
        startDate: request.initiative.start_date,
        endDate: request.initiative.end_date,
        skillsNeeded: request.initiative.skills_needed || [],
        locations: request.initiative.locations || [],
        tags: request.initiative.tags || [],
        coverImageUrl: request.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    }));
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }
};

export const getJoinRequestsForInitiative = async (initiativeId: string): Promise<JoinRequest[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('join_requests')
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .eq('initiative_id', initiativeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(request => ({
      id: request.id,
      initiativeId: request.initiative_id,
      userId: request.user_id,
      message: request.message,
      status: request.status,
      createdAt: request.created_at,
      user: {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
        role: request.user.role,
        skills: request.user.skills || [],
        location: request.user.location,
        weeklyCapacityHrs: request.user.weekly_capacity_hrs,
        avatarUrl: request.user.avatar_url
      },
      initiative: {
        id: request.initiative.id,
        title: request.initiative.title,
        description: request.initiative.description,
        status: request.initiative.status,
        startDate: request.initiative.start_date,
        endDate: request.initiative.end_date,
        skillsNeeded: request.initiative.skills_needed || [],
        locations: request.initiative.locations || [],
        tags: request.initiative.tags || [],
        coverImageUrl: request.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    }));
  } catch (error) {
    console.error('Error fetching join requests for initiative:', error);
    return [];
  }
};

export const createJoinRequest = async (request: Omit<JoinRequest, 'id' | 'createdAt'>): Promise<JoinRequest | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('join_requests')
      .insert({
        id: `join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        initiative_id: request.initiativeId,
        user_id: request.userId,
        message: request.message,
        status: request.status,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      initiativeId: data.initiative_id,
      userId: data.user_id,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url
      },
      initiative: {
        id: data.initiative.id,
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    };
  } catch (error) {
    console.error('Error creating join request:', error);
    return null;
  }
};

export const updateJoinRequest = async (id: string, status: string): Promise<JoinRequest | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('join_requests')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      initiativeId: data.initiative_id,
      userId: data.user_id,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url
      },
      initiative: {
        id: data.initiative.id,
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    };
  } catch (error) {
    console.error('Error updating join request:', error);
    return null;
  }
};

export const deleteJoinRequest = async (id: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('join_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting join request:', error);
    return false;
  }
};

// Tasks CRUD
export const getAllTasks = async (): Promise<Task[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('tasks')
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(task => ({
      id: task.id,
      initiativeId: task.initiative_id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignedTo: task.assigned_to,
      createdAt: task.created_at,
      user: task.user ? {
        id: task.user.id,
        name: task.user.name,
        email: task.user.email,
        role: task.user.role,
        skills: task.user.skills || [],
        location: task.user.location,
        weeklyCapacityHrs: task.user.weekly_capacity_hrs,
        avatarUrl: task.user.avatar_url
      } : undefined,
      initiative: {
        id: task.initiative.id,
        title: task.initiative.title,
        description: task.initiative.description,
        status: task.initiative.status,
        startDate: task.initiative.start_date,
        endDate: task.initiative.end_date,
        skillsNeeded: task.initiative.skills_needed || [],
        locations: task.initiative.locations || [],
        tags: task.initiative.tags || [],
        coverImageUrl: task.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('tasks')
      .insert({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        initiative_id: task.initiativeId,
        title: task.title,
        description: task.description,
        status: task.status,
        assigned_to: task.assignedTo,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      initiativeId: data.initiative_id,
      title: data.title,
      description: data.description,
      status: data.status,
      assignedTo: data.assigned_to,
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url
      } : undefined,
      initiative: {
        id: data.initiative.id,
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        assigned_to: updates.assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        initiative:initiatives(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      initiativeId: data.initiative_id,
      title: data.title,
      description: data.description,
      status: data.status,
      assignedTo: data.assigned_to,
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url
      } : undefined,
      initiative: {
        id: data.initiative.id,
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url,
        owner: {
          id: '',
          name: '',
          email: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      }
    };
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
};

export const deleteTask = async (id: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

// Notifications CRUD
export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  if (!isDatabaseAvailable() || !userId) return [];
  
  try {
    const { data, error } = await supabase!
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const { data, error } = await supabase!
      .from('notifications')
      .insert({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: notification.isRead,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: data.is_read,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};
