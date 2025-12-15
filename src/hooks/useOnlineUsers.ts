import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useOnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = new Set<string>();
        Object.keys(state).forEach(key => {
          userIds.add(key);
        });
        setOnlineUserIds(userIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isUserOnline = (userId: string) => onlineUserIds.has(userId);

  return { onlineUserIds, isUserOnline };
}
