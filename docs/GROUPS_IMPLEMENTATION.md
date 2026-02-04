# Groups System Implementation Guide

## Overview

This document provides a complete implementation guide for adding a groups system to the Board Game Tracker. Groups allow users to:
- Create gaming groups (e.g., "Friday Night Games", "Toronto Board Gamers")
- Share their game library with group members
- Log play sessions that are visible to group members
- Track group statistics and leaderboards

**Based on lessons learned from INCONNU/VTES Tracker implementation.**

---

## Database Schema

### Phase 1: Core Tables

```sql
-- Migration: 001_groups_core.sql

-- ============================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- These MUST be created BEFORE RLS policies
-- They bypass RLS to prevent infinite recursion
-- ============================================

-- Get all group IDs a user belongs to
CREATE OR REPLACE FUNCTION get_user_group_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
$$;

-- Check if user is a member of a specific group
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = group_uuid AND user_id = auth.uid()
  )
$$;

-- Check if user is an admin of a specific group
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = group_uuid AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Get all session IDs where user is a player
CREATE OR REPLACE FUNCTION get_user_session_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT session_id FROM session_players WHERE user_id = auth.uid()
$$;

-- Get a session's group_id (breaks circular dependency)
CREATE OR REPLACE FUNCTION get_session_group_id(session_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT group_id FROM sessions WHERE id = session_uuid
$$;

-- Check if user created a session
CREATE OR REPLACE FUNCTION user_created_session(session_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM sessions WHERE id = session_uuid AND created_by = auth.uid()
  )
$$;

-- ============================================
-- GROUPS TABLE
-- ============================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  timezone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  -- Soft delete support
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 to avoid confusion
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Auto-generate invite code on insert
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code VARCHAR(8);
BEGIN
  LOOP
    new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM groups WHERE invite_code = new_code);
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER groups_set_invite_code
  BEFORE INSERT ON groups
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION set_invite_code();

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_primary BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Ensure only one primary group per user
CREATE OR REPLACE FUNCTION ensure_single_primary_group()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE group_members
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER group_members_ensure_primary
  AFTER INSERT OR UPDATE OF is_primary ON group_members
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_group();

-- ============================================
-- GUEST PLAYERS TABLE (group-scoped)
-- ============================================

CREATE TABLE group_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(group_id, LOWER(name))
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_guests ENABLE ROW LEVEL SECURITY;

-- GROUPS POLICIES
CREATE POLICY "View groups"
ON groups FOR SELECT
USING (
  archived_at IS NULL
  AND deleted_at IS NULL
  AND is_group_member(id)
);

CREATE POLICY "Create groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update groups"
ON groups FOR UPDATE
USING (is_group_admin(id))
WITH CHECK (true);

-- GROUP MEMBERS POLICIES
CREATE POLICY "View group members"
ON group_members FOR SELECT
USING (group_id IN (SELECT get_user_group_ids()));

CREATE POLICY "Join groups"
ON group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own membership"
ON group_members FOR UPDATE
USING (user_id = auth.uid() OR is_group_admin(group_id))
WITH CHECK (true);

CREATE POLICY "Leave groups"
ON group_members FOR DELETE
USING (user_id = auth.uid() OR is_group_admin(group_id));

-- GROUP GUESTS POLICIES
CREATE POLICY "View group guests"
ON group_guests FOR SELECT
USING (group_id IN (SELECT get_user_group_ids()));

CREATE POLICY "Create group guests"
ON group_guests FOR INSERT
WITH CHECK (group_id IN (SELECT get_user_group_ids()));

CREATE POLICY "Update group guests"
ON group_guests FOR UPDATE
USING (is_group_admin(group_id) OR created_by = auth.uid())
WITH CHECK (true);

CREATE POLICY "Delete group guests"
ON group_guests FOR DELETE
USING (is_group_admin(group_id) OR created_by = auth.uid());

-- ============================================
-- RPC FUNCTIONS FOR INVITE CODE LOOKUP
-- ============================================

-- Get group by invite code (bypasses RLS for joining)
CREATE OR REPLACE FUNCTION get_group_by_invite_code(code VARCHAR(8))
RETURNS TABLE(
  id UUID,
  name VARCHAR(100),
  description TEXT,
  location VARCHAR(100),
  member_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.location,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id)::BIGINT as member_count
  FROM groups g
  WHERE g.invite_code = code
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
$$;

-- Join a group by invite code
CREATE OR REPLACE FUNCTION join_group_by_invite_code(code VARCHAR(8))
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_group_id UUID;
  is_first_group BOOLEAN;
BEGIN
  -- Find the group
  SELECT id INTO target_group_id
  FROM groups
  WHERE invite_code = code
    AND archived_at IS NULL
    AND deleted_at IS NULL;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = target_group_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member of this group';
  END IF;

  -- Check if this is user's first group
  SELECT NOT EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid())
  INTO is_first_group;

  -- Join the group
  INSERT INTO group_members (group_id, user_id, role, is_primary)
  VALUES (target_group_id, auth.uid(), 'member', is_first_group);

  RETURN target_group_id;
END;
$$;

-- Regenerate invite code (admin only)
CREATE OR REPLACE FUNCTION regenerate_invite_code(target_group_id UUID)
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code VARCHAR(8);
BEGIN
  -- Check if user is admin
  IF NOT is_group_admin(target_group_id) THEN
    RAISE EXCEPTION 'Only admins can regenerate invite codes';
  END IF;

  -- Generate new code
  LOOP
    new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM groups WHERE invite_code = new_code);
  END LOOP;

  -- Update the group
  UPDATE groups SET invite_code = new_code WHERE id = target_group_id;

  RETURN new_code;
END;
$$;
```

---

### Phase 2: Sessions with Group Support

```sql
-- Migration: 002_sessions_groups.sql

-- ============================================
-- MODIFY SESSIONS TABLE
-- ============================================

-- Add group_id to sessions (nullable for migration)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id);

-- ============================================
-- SESSION PLAYERS TABLE
-- ============================================

-- Assuming session_players exists, ensure it has the right structure
-- If not, create it:
/*
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- NULL for guest players
  guest_id UUID REFERENCES group_guests(id), -- NULL for registered users
  score INTEGER,
  is_winner BOOLEAN DEFAULT false,
  position INTEGER, -- 1st, 2nd, 3rd place
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT player_type CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  )
);
*/

-- ============================================
-- RLS POLICIES FOR SESSIONS
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "View sessions" ON sessions;
DROP POLICY IF EXISTS "Create sessions" ON sessions;
DROP POLICY IF EXISTS "Update sessions" ON sessions;
DROP POLICY IF EXISTS "Delete sessions" ON sessions;

-- SESSIONS POLICIES
-- View: Group member OR player in session OR creator
CREATE POLICY "View sessions"
ON sessions FOR SELECT
USING (
  group_id IN (SELECT get_user_group_ids())
  OR id IN (SELECT get_user_session_ids())
  OR created_by = auth.uid()
  OR (group_id IS NULL AND created_by = auth.uid()) -- Legacy personal sessions
);

-- Create: Must be in the group (or null group for personal)
CREATE POLICY "Create sessions"
ON sessions FOR INSERT
WITH CHECK (
  group_id IS NULL
  OR group_id IN (SELECT get_user_group_ids())
);

-- Update: Creator or group admin
CREATE POLICY "Update sessions"
ON sessions FOR UPDATE
USING (
  created_by = auth.uid()
  OR is_group_admin(group_id)
)
WITH CHECK (true);

-- Delete: Creator or group admin
CREATE POLICY "Delete sessions"
ON sessions FOR DELETE
USING (
  created_by = auth.uid()
  OR is_group_admin(group_id)
);

-- SESSION PLAYERS POLICIES
DROP POLICY IF EXISTS "View session players" ON session_players;
DROP POLICY IF EXISTS "Create session players" ON session_players;
DROP POLICY IF EXISTS "Update session players" ON session_players;
DROP POLICY IF EXISTS "Delete session players" ON session_players;

CREATE POLICY "View session players"
ON session_players FOR SELECT
USING (
  session_id IN (SELECT get_user_session_ids())
  OR get_session_group_id(session_id) IN (SELECT get_user_group_ids())
  OR user_created_session(session_id)
);

CREATE POLICY "Create session players"
ON session_players FOR INSERT
WITH CHECK (
  get_session_group_id(session_id) IN (SELECT get_user_group_ids())
  OR user_created_session(session_id)
);

CREATE POLICY "Update session players"
ON session_players FOR UPDATE
USING (
  user_created_session(session_id)
  OR is_group_admin(get_session_group_id(session_id))
)
WITH CHECK (true);

CREATE POLICY "Delete session players"
ON session_players FOR DELETE
USING (
  user_created_session(session_id)
  OR is_group_admin(get_session_group_id(session_id))
);
```

---

### Phase 3: Game Library with Group Sharing

```sql
-- Migration: 003_games_groups.sql

-- ============================================
-- GAMES TABLE (BGG integration)
-- ============================================

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER UNIQUE, -- BoardGameGeek ID
  name VARCHAR(255) NOT NULL,
  year_published INTEGER,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER, -- minutes
  image_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER GAME COLLECTION (group-shareable)
-- ============================================

CREATE TABLE IF NOT EXISTS user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id), -- NULL = personal only
  is_shared BOOLEAN DEFAULT true, -- Visible to group members
  owned BOOLEAN DEFAULT true,
  wishlist BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- ============================================
-- RLS POLICIES FOR GAMES
-- ============================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Games table is reference data - anyone can read
CREATE POLICY "View games"
ON games FOR SELECT
USING (true);

CREATE POLICY "Create games"
ON games FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- USER GAMES POLICIES
CREATE POLICY "View user games"
ON user_games FOR SELECT
USING (
  -- Own collection
  user_id = auth.uid()
  -- OR shared games from group members
  OR (
    is_shared = true
    AND group_id IN (SELECT get_user_group_ids())
  )
);

CREATE POLICY "Create user games"
ON user_games FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update user games"
ON user_games FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete user games"
ON user_games FOR DELETE
USING (user_id = auth.uid());
```

---

## React Hooks

### useGroupManagement.ts

```typescript
// src/hooks/useGroupManagement.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Group {
  id: string;
  invite_code: string;
  name: string;
  description: string | null;
  location: string | null;
  timezone: string | null;
  avatar_url: string | null;
  created_at: string;
  created_by: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  is_primary: boolean;
  joined_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupWithMembership extends Group {
  role: 'admin' | 'member';
  is_primary: boolean;
  member_count: number;
}

export function useGroupManagement() {
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGroups([]);
        return;
      }

      // Get user's memberships with group details
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select(`
          role,
          is_primary,
          group:groups(*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Get member counts for each group
      const groupsWithCounts: GroupWithMembership[] = await Promise.all(
        (memberships || []).map(async (m) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', (m.group as Group).id);

          return {
            ...(m.group as Group),
            role: m.role as 'admin' | 'member',
            is_primary: m.is_primary,
            member_count: count || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (data: {
    name: string;
    description?: string;
    location?: string;
    timezone?: string;
  }): Promise<Group | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Check if this is the user's first group
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const isFirstGroup = (count || 0) === 0;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
          is_primary: isFirstGroup,
        });

      if (memberError) throw memberError;

      await fetchGroups();
      return group;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      return null;
    }
  };

  const joinGroupByCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('join_group_by_invite_code', {
        code: code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      });

      if (error) throw error;

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
      return false;
    }
  };

  const setPrimaryGroup = async (groupId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .update({ is_primary: true })
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary group');
      return false;
    }
  };

  const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:profiles(display_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('role', { ascending: false }) // Admins first
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
      return [];
    }
  };

  const promoteToAdmin = async (groupId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote member');
      return false;
    }
  };

  const removeMember = async (groupId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      return false;
    }
  };

  const regenerateInviteCode = async (groupId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('regenerate_invite_code', {
        target_group_id: groupId,
      });

      if (error) throw error;

      await fetchGroups();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate code');
      return null;
    }
  };

  return {
    groups,
    loading,
    error,
    primaryGroup: groups.find((g) => g.is_primary) || null,
    createGroup,
    joinGroupByCode,
    leaveGroup,
    setPrimaryGroup,
    getGroupMembers,
    promoteToAdmin,
    removeMember,
    regenerateInviteCode,
    refresh: fetchGroups,
  };
}
```

---

## Critical Lessons (from INCONNU implementation)

### 1. RLS Anti-Patterns to Avoid

**Never do this:**
```sql
-- BAD: Self-referential query causes infinite recursion
CREATE POLICY "view" ON group_members FOR SELECT
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
```

**Always use SECURITY DEFINER functions instead:**
```sql
-- GOOD: Function bypasses RLS
USING (group_id IN (SELECT get_user_group_ids()))
```

### 2. UPDATE Policies Need WITH CHECK

```sql
-- INCOMPLETE: Updates will silently fail
CREATE POLICY "update" ON table FOR UPDATE USING (condition)

-- COMPLETE: Include WITH CHECK
CREATE POLICY "update" ON table FOR UPDATE USING (condition) WITH CHECK (true)
```

### 3. Don't Forget Write Policies

After SELECT policies work, you MUST also add:
- INSERT policies (WITH CHECK)
- UPDATE policies (USING + WITH CHECK)
- DELETE policies (USING)

### 4. Verify Column Names

Before writing migrations, check the actual schema:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table';
```

---

## Implementation Checklist

- [ ] Create SECURITY DEFINER helper functions FIRST
- [ ] Create groups table with invite code generation
- [ ] Create group_members table with primary group trigger
- [ ] Create group_guests table
- [ ] Add RLS policies for all three tables
- [ ] Create RPC functions for invite code lookup/join
- [ ] Add group_id to sessions table
- [ ] Update sessions RLS policies
- [ ] Add group_id to user_games table
- [ ] Update user_games RLS policies
- [ ] Create useGroupManagement hook
- [ ] Build group settings UI
- [ ] Add group guard to session creation

---

## UI Flow

### Solo Mode (No Groups)
- Can browse games, search BGG
- Can add games to personal collection
- Cannot log play sessions
- Prompted to create/join group when attempting to log

### Group Member
- Full access to log sessions
- Sessions auto-assigned to primary group
- Can view group members' shared collections
- Can view group session history

### Group Admin
- All member permissions
- Can edit any group session
- Can remove members
- Can regenerate invite code
- Can promote members to admin
