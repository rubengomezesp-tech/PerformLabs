import type { MemberHome, MemberHomeRepository } from "@/src/domain/member-home";
import { todayKey } from "@/src/domain/member-home";

function inDays(days: number, hour = 18): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

let demoHabits = [
  { id: "habit-water", name: "3 L de agua", done: true },
  { id: "habit-protein", name: "Proteína en cada comida", done: false },
  { id: "habit-steps", name: "9.000 pasos", done: false },
];

export class DemoMemberHomeRepository implements MemberHomeRepository {
  async load(): Promise<MemberHome> {
    return {
      source: "demo",
      updatedAt: new Date().toISOString(),
      member: {
        id: "demo-member",
        workspaceId: "demo-workspace",
        firstName: "Álex",
        fullName: "Álex Martín",
      },
      program: {
        id: "demo-program",
        name: "Reinicio · Fuerza y pérdida de grasa",
        currentWeek: 2,
        totalWeeks: 12,
        nextReviewOn: inDays(4).slice(0, 10),
      },
      todayWorkout: {
        id: "demo-workout",
        title: "Torso · Base de fuerza",
        focus: "Técnica y progresión",
        scheduledOn: todayKey(),
        minutes: 58,
        exerciseCount: 7,
        status: "scheduled",
      },
      nutrition: {
        id: "demo-nutrition",
        name: "Déficit flexible",
        mealsPerDay: 4,
        targetCalories: 2175,
        targetProteinG: 181,
      },
      habits: demoHabits.map((habit) => ({ ...habit })),
      sessionBalance: {
        remaining: 7,
        purchased: 10,
        nextExpiry: inDays(42).slice(0, 10),
      },
      nextSession: {
        id: "demo-session",
        startsAt: inDays(1, 18),
        location: "Gimnasio del edificio",
      },
    };
  }

  async toggleHabit(_member: MemberHome["member"], habitId: string, _date: string, done: boolean): Promise<void> {
    demoHabits = demoHabits.map((habit) => habit.id === habitId ? { ...habit, done } : habit);
  }
}

