'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface GroupMember {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: Profile;
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface UseGroupDataResult {
  group: Group | null;
  members: GroupMember[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGroupData(userId: string | null): UseGroupDataResult {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGroupData = useCallback(async () => {
    if (!userId) {
      setGroup(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's group membership
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .single();

      if (membershipError) {
        if (membershipError.code === 'PGRST116') {
          // No group found
          setGroup(null);
          setMembers([]);
          setLoading(false);
          return;
        }
        throw membershipError;
      }

      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', membership.group_id)
        .single();

      if (groupError) {
        throw groupError;
      }

      setGroup(groupData);

      // Get all members of this group
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          joined_at,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq('group_id', membership.group_id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        throw membersError;
      }

      setMembers(membersData as unknown as GroupMember[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch group data'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  return {
    group,
    members,
    loading,
    error,
    refresh: fetchGroupData,
  };
}
