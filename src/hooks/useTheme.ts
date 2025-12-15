import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Load user's theme preference from database on mount
  useEffect(() => {
    const loadUserTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();
        
        if (data?.theme_preference) {
          const dbTheme = data.theme_preference as Theme;
          setTheme(dbTheme);
          localStorage.setItem('theme', dbTheme);
        }
      }
    };

    loadUserTheme();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    
    // Save to database if user is logged in
    if (userId) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', userId);
    }
    
    window.location.reload();
  };

  return { theme, setTheme, toggleTheme };
}
