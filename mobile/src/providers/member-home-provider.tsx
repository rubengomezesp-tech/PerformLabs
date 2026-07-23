import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MemberHome, MemberHomeRepository } from "@/src/domain/member-home";
import { todayKey } from "@/src/domain/member-home";
import { DemoMemberHomeRepository } from "@/src/infrastructure/demo-member-home-repository";
import { supabase } from "@/src/infrastructure/supabase/client";
import { SupabaseMemberHomeRepository } from "@/src/infrastructure/supabase/member-home-repository";
import { useAuth } from "@/src/providers/auth-provider";

type MemberHomeContextValue = {
  data: MemberHome | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh(): Promise<void>;
  toggleHabit(habitId: string, done: boolean): Promise<void>;
  requestSessionChange(requestedStartsAt: string, message: string): Promise<void>;
};

const MemberHomeContext = createContext<MemberHomeContextValue | null>(null);
const demoRepository = new DemoMemberHomeRepository();

export function MemberHomeProvider({ children }: { children: ReactNode }) {
  const { demoMode, user } = useAuth();
  const repository = useMemo<MemberHomeRepository | null>(() => {
    if (demoMode) return demoRepository;
    return supabase ? new SupabaseMemberHomeRepository(supabase) : null;
  }, [demoMode]);
  const [data, setData] = useState<MemberHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (manual = false) => {
    if (!repository || (!demoMode && !user)) {
      setLoading(false);
      return;
    }
    manual ? setRefreshing(true) : setLoading(true);
    try {
      const home = await repository.load(user?.id ?? "demo-user");
      setData(home);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("MEMBER_HOME_LOAD_FAILED"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [demoMode, repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleHabit = useCallback(async (habitId: string, done: boolean) => {
    if (!repository || !data) return;
    const previous = data;
    setData({ ...data, habits: data.habits.map((habit) => habit.id === habitId ? { ...habit, done } : habit) });
    try {
      await repository.toggleHabit(data.member, habitId, todayKey(), done);
    } catch (cause) {
      setData(previous);
      setError(cause instanceof Error ? cause : new Error("HABIT_UPDATE_FAILED"));
    }
  }, [data, repository]);

  const requestSessionChange = useCallback(async (requestedStartsAt: string, message: string) => {
    if (!repository || !data?.nextSession) throw new Error("SESSION_NOT_AVAILABLE");
    await repository.requestSessionChange(data.member, data.nextSession, requestedStartsAt, message);
    await load(true);
  }, [data, load, repository]);

  const value = useMemo<MemberHomeContextValue>(() => ({
    data,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    toggleHabit,
    requestSessionChange,
  }), [data, error, load, loading, refreshing, requestSessionChange, toggleHabit]);

  return <MemberHomeContext.Provider value={value}>{children}</MemberHomeContext.Provider>;
}

export function useMemberHome(): MemberHomeContextValue {
  const value = useContext(MemberHomeContext);
  if (!value) throw new Error("useMemberHome must be used inside MemberHomeProvider");
  return value;
}
