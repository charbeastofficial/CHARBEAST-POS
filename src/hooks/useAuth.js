import { useEffect, useState } from 'react';
import { supabase, setRememberMe } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let profile;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            profile = data;
          } catch {
            profile = null;
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            ...profile
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to check session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          let profile;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            profile = data;
          } catch {
            profile = null;
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            ...profile
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password, remember = true) => {
    setRememberMe(remember);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    let profile;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      profile = profileData;
    } catch {
      profile = null;
    }

    setUser({
      id: data.user.id,
      email: data.user.email,
      ...profile
    });

    return data.user;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    logout
  };
}