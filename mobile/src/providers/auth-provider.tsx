import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/src/infrastructure/supabase/client";

type AuthContextValue = {
  loading: boolean;
  demoMode: boolean;
  canSignIn: boolean;
  session: Session | null;
  user: User | null;
  enterDemo(): void;
  leaveDemo(): void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setDemoMode(false);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    setDemoMode(false);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    demoMode,
    canSignIn: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    enterDemo: () => setDemoMode(true),
    leaveDemo: () => setDemoMode(!isSupabaseConfigured),
    signIn,
    signOut,
  }), [demoMode, loading, session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
