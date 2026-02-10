-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_wanted ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: public.users.id for the current auth user (Supabase Auth links via auth_user_id)
-- All policies that check "is current user" use this pattern instead of auth.uid()::text = id.

-- Users table policies
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (false);

-- Initiatives: owner_id is public.users.id; current user is owner iff that user's auth_user_id = auth.uid()
CREATE POLICY "Users can read all initiatives" ON initiatives
  FOR SELECT USING (true);

CREATE POLICY "Users can create initiatives" ON initiatives
  FOR INSERT WITH CHECK (owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own initiatives" ON initiatives
  FOR UPDATE USING (owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own initiatives" ON initiatives
  FOR DELETE USING (owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Help wanted: allow if initiative owner is current user
CREATE POLICY "Users can read all help wanted" ON help_wanted
  FOR SELECT USING (true);

CREATE POLICY "Users can create help wanted for own initiatives" ON help_wanted
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update help wanted for own initiatives" ON help_wanted
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete help wanted for own initiatives" ON help_wanted
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Initiative team members: user_id is public.users.id
CREATE POLICY "Users can read all team members" ON initiative_team_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join initiatives" ON initiative_team_members
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can leave initiatives" ON initiative_team_members
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Initiative owners can manage team members" ON initiative_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Join requests: user_id and initiative owner checks
CREATE POLICY "Users can read relevant join requests" ON join_requests
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM initiative_team_members itm
      WHERE itm.initiative_id = join_requests.initiative_id AND itm.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create join requests" ON join_requests
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Initiative owners can update join requests" ON join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Initiative owners can delete join requests" ON join_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Tasks: owner and assignee checks via public.users.id
CREATE POLICY "Users can read relevant tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM initiative_team_members itm
      WHERE itm.initiative_id = tasks.initiative_id AND itm.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ) OR
    assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Initiative owners can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Initiative owners and assignees can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ) OR
    assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Initiative owners can delete tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      WHERE i.id = initiative_id AND i.owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Notifications: user_id is public.users.id
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
