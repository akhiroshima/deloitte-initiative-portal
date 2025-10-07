-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_wanted ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read all users (for team member selection, etc.)
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Only admins can insert new users (registration handled by functions)
CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (false);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (false);

-- Initiatives table policies
-- Users can read all initiatives
CREATE POLICY "Users can read all initiatives" ON initiatives
  FOR SELECT USING (true);

-- Users can create initiatives
CREATE POLICY "Users can create initiatives" ON initiatives
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- Users can update initiatives they own
CREATE POLICY "Users can update own initiatives" ON initiatives
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- Users can delete initiatives they own
CREATE POLICY "Users can delete own initiatives" ON initiatives
  FOR DELETE USING (auth.uid()::text = owner_id);

-- Help wanted table policies
-- Users can read all help wanted posts
CREATE POLICY "Users can read all help wanted" ON help_wanted
  FOR SELECT USING (true);

-- Users can create help wanted posts for initiatives they own
CREATE POLICY "Users can create help wanted for own initiatives" ON help_wanted
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Users can update help wanted posts for initiatives they own
CREATE POLICY "Users can update help wanted for own initiatives" ON help_wanted
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Users can delete help wanted posts for initiatives they own
CREATE POLICY "Users can delete help wanted for own initiatives" ON help_wanted
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Initiative team members table policies
-- Users can read all team members
CREATE POLICY "Users can read all team members" ON initiative_team_members
  FOR SELECT USING (true);

-- Users can join initiatives (insert themselves)
CREATE POLICY "Users can join initiatives" ON initiative_team_members
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can leave initiatives (delete themselves)
CREATE POLICY "Users can leave initiatives" ON initiative_team_members
  FOR DELETE USING (auth.uid()::text = user_id);

-- Initiative owners can manage team members
CREATE POLICY "Initiative owners can manage team members" ON initiative_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Join requests table policies
-- Users can read join requests for initiatives they own or are involved in
CREATE POLICY "Users can read relevant join requests" ON join_requests
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM initiative_team_members 
      WHERE initiative_id = join_requests.initiative_id AND user_id = auth.uid()::text
    )
  );

-- Users can create join requests
CREATE POLICY "Users can create join requests" ON join_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Initiative owners can update join requests for their initiatives
CREATE POLICY "Initiative owners can update join requests" ON join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Initiative owners can delete join requests for their initiatives
CREATE POLICY "Initiative owners can delete join requests" ON join_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Tasks table policies
-- Users can read tasks for initiatives they're involved in
CREATE POLICY "Users can read relevant tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM initiative_team_members 
      WHERE initiative_id = tasks.initiative_id AND user_id = auth.uid()::text
    ) OR
    assigned_to = auth.uid()::text
  );

-- Initiative owners can create tasks
CREATE POLICY "Initiative owners can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Initiative owners and assigned users can update tasks
CREATE POLICY "Initiative owners and assignees can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    ) OR
    assigned_to = auth.uid()::text
  );

-- Initiative owners can delete tasks
CREATE POLICY "Initiative owners can delete tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives 
      WHERE id = initiative_id AND owner_id = auth.uid()::text
    )
  );

-- Notifications table policies
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- System can create notifications (handled by functions)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid()::text = user_id);
