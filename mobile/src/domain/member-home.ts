export type TodayWorkout = {
  id: string;
  title: string;
  focus: string | null;
  scheduledOn: string | null;
  minutes: number;
  exerciseCount: number;
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
};

export type MemberHabit = {
  id: string;
  name: string;
  done: boolean;
};

export type MemberHome = {
  source: "live" | "demo";
  updatedAt: string;
  member: {
    id: string;
    workspaceId: string;
    firstName: string;
    fullName: string;
  };
  program: {
    id: string;
    name: string;
    currentWeek: number;
    totalWeeks: number;
    nextReviewOn: string | null;
  } | null;
  todayWorkout: TodayWorkout | null;
  nutrition: {
    id: string;
    name: string;
    mealsPerDay: number;
    targetCalories: number | null;
    targetProteinG: number | null;
  } | null;
  habits: MemberHabit[];
  sessionBalance: {
    remaining: number;
    purchased: number;
    nextExpiry: string | null;
  };
  nextSession: {
    id: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    location: string | null;
    changeRequestPending: boolean;
  } | null;
};

export interface MemberHomeRepository {
  load(userId: string): Promise<MemberHome>;
  toggleHabit(member: MemberHome["member"], habitId: string, date: string, done: boolean): Promise<void>;
  requestSessionChange(member: MemberHome["member"], session: NonNullable<MemberHome["nextSession"]>, requestedStartsAt: string, message: string): Promise<void>;
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function programProgress(currentWeek: number, totalWeeks: number): number {
  if (totalWeeks <= 0) return 0;
  return Math.min(1, Math.max(0, currentWeek / totalWeeks));
}
