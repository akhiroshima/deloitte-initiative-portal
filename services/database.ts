import { Initiative, InitiativeStatus, User, HelpWanted, JoinRequest, JoinRequestStatus, Task, TaskStatus, Notification, NotificationType } from '../types';
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

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const row: Record<string, unknown> = pickDefined({
      name: updates.name,
      role: updates.role,
      skills: updates.skills,
      location: updates.location,
      weekly_capacity_hrs: updates.weeklyCapacityHrs,
      avatar_url: updates.avatarUrl,
    });
    if (Object.keys(row).length === 0) return getUserById(id);
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('users')
      .update(row)
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

// Initiatives CRUD (single query with joins to avoid N+1)
export const getAllInitiatives = async (): Promise<Initiative[]> => {
  if (!isDatabaseAvailable()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('initiatives')
      .select(`
        *,
        owner:users!owner_id(id, name, email, role, skills, location, weekly_capacity_hrs, avatar_url),
        initiative_team_members(user_id, committed_hours)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((row: {
      id: string;
      title: string;
      description: string | null;
      owner_id: string;
      status: string;
      start_date: string | null;
      end_date: string | null;
      skills_needed: string[] | null;
      locations: string[] | null;
      tags: string[] | null;
      cover_image_url: string | null;
      owner: { id: string; name: string; email: string; username: string; role: string; skills: string[]; location: string; weekly_capacity_hrs: number; avatar_url: string | null } | null;
      initiative_team_members: { user_id: string; committed_hours: number }[] | null;
    }) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      ownerId: row.owner_id,
      teamMembers: (row.initiative_team_members || []).map(m => ({ userId: m.user_id, committedHours: m.committed_hours })),
      status: row.status as InitiativeStatus,
      startDate: row.start_date ?? '',
      endDate: row.end_date ?? undefined,
      skillsNeeded: row.skills_needed || [],
      locations: row.locations || [],
      tags: row.tags || [],
      coverImageUrl: row.cover_image_url ?? '',
      owner: row.owner ? {
        id: row.owner.id,
        name: row.owner.name,
        email: row.owner.email,
        username: row.owner.username,
        role: row.owner.role as User['role'],
        skills: row.owner.skills || [],
        location: row.owner.location,
        weeklyCapacityHrs: row.owner.weekly_capacity_hrs,
        avatarUrl: row.owner.avatar_url ?? ''
      } : undefined
    }));
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
      status: data.status as InitiativeStatus,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url ?? '',
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        username: ownerData.username,
        role: ownerData.role as User['role'],
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url ?? ''
      } : undefined
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
        owner_id: initiative.owner!.id,
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
    
    // Automatically add owner as team member with default committed hours
    const defaultCommittedHours = 10; // Default hours per week for owner
    const { error: teamMemberError } = await supabase!
      .from('initiative_team_members')
      .insert({
        initiative_id: data.id,
        user_id: data.owner_id,
        committed_hours: defaultCommittedHours
      });
    
    if (teamMemberError) {
      console.error('Error adding owner as team member:', teamMemberError);
      // Continue execution - don't fail initiative creation if team member addition fails
    }
    
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
      teamMembers: [{
        userId: data.owner_id,
        committedHours: defaultCommittedHours
      }], // Owner is automatically a team member
      status: data.status as InitiativeStatus,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url ?? '',
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        username: ownerData.username,
        role: ownerData.role as User['role'],
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url ?? ''
      } : undefined
    };
  } catch (error) {
    console.error('Error creating initiative:', error);
    return null;
  }
};

export const updateInitiative = async (id: string, updates: Partial<Initiative>): Promise<Initiative | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const row: Record<string, unknown> = pickDefined({
      title: updates.title,
      description: updates.description,
      status: updates.status,
      start_date: updates.startDate,
      end_date: updates.endDate,
      skills_needed: updates.skillsNeeded,
      locations: updates.locations,
      tags: updates.tags,
      cover_image_url: updates.coverImageUrl,
    });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('initiatives')
      .update(row)
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
      status: data.status as InitiativeStatus,
      startDate: data.start_date,
      endDate: data.end_date,
      skillsNeeded: data.skills_needed || [],
      locations: data.locations || [],
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url ?? '',
      owner: ownerData ? {
        id: ownerData.id,
        name: ownerData.name,
        email: ownerData.email,
        username: ownerData.username,
        role: ownerData.role as User['role'],
        skills: ownerData.skills || [],
        location: ownerData.location,
        weeklyCapacityHrs: ownerData.weekly_capacity_hrs,
        avatarUrl: ownerData.avatar_url ?? ''
      } : undefined
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

export const addTeamMember = async (
  initiativeId: string,
  userId: string,
  committedHours: number
): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  try {
    const { error } = await supabase!
      .from('initiative_team_members')
      .insert({
        initiative_id: initiativeId,
        user_id: userId,
        committed_hours: committedHours
      });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding team member:', error);
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
        ownerId: post.initiative.owner_id,
        teamMembers: [],
        title: post.initiative.title,
        description: post.initiative.description,
        status: post.initiative.status,
        startDate: post.initiative.start_date,
        endDate: post.initiative.end_date,
        skillsNeeded: post.initiative.skills_needed || [],
        locations: post.initiative.locations || [],
        tags: post.initiative.tags || [],
        coverImageUrl: post.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
    };
  } catch (error) {
    console.error('Error creating help wanted post:', error);
    return null;
  }
};

export const updateHelpWanted = async (
  id: string,
  updates: Partial<Omit<HelpWanted, 'id' | 'initiativeId'>>
): Promise<HelpWanted | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const row: Record<string, unknown> = pickDefined({
      skill: updates.skill,
      hours_per_week: updates.hoursPerWeek,
      status: updates.status,
    });
    if (Object.keys(row).length === 0) return null;
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('help_wanted')
      .update(row)
      .eq('id', id)
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
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
    };
  } catch (error) {
    console.error('Error updating help wanted post:', error);
    return null;
  }
};

export const deleteHelpWanted = async (id: string): Promise<boolean> => {
  if (!isDatabaseAvailable()) return false;
  
  try {
    const { error } = await supabase!
      .from('help_wanted')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting help wanted post:', error);
    return false;
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
        username: request.user.username,
        role: request.user.role,
        skills: request.user.skills || [],
        location: request.user.location,
        weeklyCapacityHrs: request.user.weekly_capacity_hrs,
        avatarUrl: request.user.avatar_url ?? ''
      },
      initiative: {
        id: request.initiative.id,
        ownerId: request.initiative.owner_id,
        teamMembers: [],
        title: request.initiative.title,
        description: request.initiative.description,
        status: request.initiative.status,
        startDate: request.initiative.start_date,
        endDate: request.initiative.end_date,
        skillsNeeded: request.initiative.skills_needed || [],
        locations: request.initiative.locations || [],
        tags: request.initiative.tags || [],
        coverImageUrl: request.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
        username: request.user.username,
        role: request.user.role,
        skills: request.user.skills || [],
        location: request.user.location,
        weeklyCapacityHrs: request.user.weekly_capacity_hrs,
        avatarUrl: request.user.avatar_url ?? ''
      },
      initiative: {
        id: request.initiative.id,
        ownerId: request.initiative.owner_id,
        teamMembers: [],
        title: request.initiative.title,
        description: request.initiative.description,
        status: request.initiative.status,
        startDate: request.initiative.start_date,
        endDate: request.initiative.end_date,
        skillsNeeded: request.initiative.skills_needed || [],
        locations: request.initiative.locations || [],
        tags: request.initiative.tags || [],
        coverImageUrl: request.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
        username: data.user.username,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url ?? ''
      },
      initiative: {
        id: data.initiative.id,
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
        username: data.user.username,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url ?? ''
      },
      initiative: {
        id: data.initiative.id,
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
      assigneeId: task.assigned_to,
      createdAt: task.created_at,
      user: task.user ? {
        id: task.user.id,
        name: task.user.name,
        email: task.user.email,
        username: task.user.username,
        role: task.user.role,
        skills: task.user.skills || [],
        location: task.user.location,
        weeklyCapacityHrs: task.user.weekly_capacity_hrs,
        avatarUrl: task.user.avatar_url ?? ''
      } : undefined,
      initiative: {
        id: task.initiative.id,
        ownerId: task.initiative.owner_id,
        teamMembers: [],
        title: task.initiative.title,
        description: task.initiative.description,
        status: task.initiative.status,
        startDate: task.initiative.start_date,
        endDate: task.initiative.end_date,
        skillsNeeded: task.initiative.skills_needed || [],
        locations: task.initiative.locations || [],
        tags: task.initiative.tags || [],
        coverImageUrl: task.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
        assigned_to: task.assigneeId,
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
      assigneeId: data.assigned_to,
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url ?? ''
      } : undefined,
      initiative: {
        id: data.initiative.id,
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const row: Record<string, unknown> = pickDefined({
      title: updates.title,
      description: updates.description,
      status: updates.status,
      assigned_to: updates.assigneeId,
    });
    if (Object.keys(row).length === 0) return null;
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('tasks')
      .update(row)
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
      assigneeId: data.assigned_to,
      createdAt: data.created_at,
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        skills: data.user.skills || [],
        location: data.user.location,
        weeklyCapacityHrs: data.user.weekly_capacity_hrs,
        avatarUrl: data.user.avatar_url ?? ''
      } : undefined,
      initiative: {
        id: data.initiative.id,
        ownerId: data.initiative.owner_id,
        teamMembers: [],
        title: data.initiative.title,
        description: data.initiative.description,
        status: data.initiative.status,
        startDate: data.initiative.start_date,
        endDate: data.initiative.end_date,
        skillsNeeded: data.initiative.skills_needed || [],
        locations: data.initiative.locations || [],
        tags: data.initiative.tags || [],
        coverImageUrl: data.initiative.cover_image_url ?? '',
        owner: {
          id: '',
          name: '',
          email: '',
          username: '',
          role: 'Developer',
          skills: [],
          location: '',
          weeklyCapacityHrs: 40,
          avatarUrl: ''
        }
      } as Initiative
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
    return data.map((notification: { id: string; user_id: string; type: string; message: string; is_read: boolean; created_at: string; initiative_id?: string | null }) => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type as NotificationType,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      initiativeId: notification.initiative_id ?? '',
      link: notification.initiative_id ? { initiativeId: notification.initiative_id } : { initiativeId: '' },
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | null> => {
  if (!isDatabaseAvailable()) return null;
  
  try {
    const title = (notification as { title?: string }).title ?? notification.type;
    const { data, error } = await supabase!
      .from('notifications')
      .insert({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: notification.userId,
        type: notification.type,
        title,
        message: notification.message,
        is_read: notification.isRead,
        created_at: new Date().toISOString(),
        ...(notification.initiativeId && { initiative_id: notification.initiativeId }),
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      message: data.message,
      isRead: data.is_read,
      createdAt: data.created_at,
      initiativeId: data.initiative_id ?? '',
      link: data.initiative_id ? { initiativeId: data.initiative_id } : { initiativeId: '' },
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
