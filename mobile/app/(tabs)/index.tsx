import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CalendarClock, Check, ChevronRight, CircleUserRound, Dumbbell, MessageCircle, Salad, Sparkles } from "lucide-react-native";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandBar, ErrorState, LoadingState, Metric, Screen } from "@/src/components/ui";
import { programProgress } from "@/src/domain/member-home";
import { t } from "@/src/i18n";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? t.home.greetingMorning : hour < 20 ? t.home.greetingAfternoon : t.home.greetingEvening;
}

function formatDay(value: Date | string, options: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export default function TodayScreen() {
  const { data, error, loading, refreshing, refresh, toggleHabit } = useMemberHome();

  if (loading && !data) return <Screen><BrandBar /><LoadingState /></Screen>;
  if (error && !data) return <Screen><BrandBar /><ErrorState title={t.home.errorTitle} text={t.home.errorText} retry={refresh} /></Screen>;
  if (!data) return null;

  const completedHabits = data.habits.filter((habit) => habit.done).length;
  const progress = data.program ? programProgress(data.program.currentWeek, data.program.totalWeeks) : 0;

  async function messageCoach() {
    const text = encodeURIComponent(t.home.messageCoachText);
    await Linking.openURL(`https://wa.me/16452482325?text=${text}`);
  }

  return (
    <Screen>
      <BrandBar demo={data.source === "demo"} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View>
            <Text style={styles.date}>{formatDay(new Date(), { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</Text>
            <Text style={styles.greeting}>{greeting()}, {data.member.firstName}</Text>
            <Text style={styles.introCopy}>{data.todayWorkout ? t.home.sessionReady : t.home.coachMaintains}</Text>
          </View>
          <Pressable accessibilityLabel={t.home.messageCoach} accessibilityRole="button" onPress={messageCoach} style={styles.coachButton}><MessageCircle color={colors.text} size={19} /></Pressable>
        </View>

        <View style={styles.syncLine}>
          <View style={styles.syncDot} />
          <Text style={styles.syncLineText}>{data.source === "live" ? t.home.live : t.common.demo}</Text>
          <Text style={styles.syncLineText}>·</Text>
          <Text style={styles.syncLineText}>{t.home.refreshed}</Text>
        </View>

        <View style={styles.routeHeader}>
          <Text style={styles.routeEyebrow}>{t.home.route}</Text>
          <View style={styles.readyPill}><Sparkles color={colors.cyan} size={13} /><Text style={styles.readyPillText}>{data.todayWorkout ? t.home.ready : t.common.preparing}</Text></View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeLine} />
          <View style={styles.routeLabelRow}><View style={styles.routeNodeActive}><Text style={styles.routeNodeActiveText}>1</Text></View><Text style={styles.routeMoment}>{t.home.now}</Text></View>

          <LinearGradient colors={["#143D63", "#101922", colors.surface]} style={styles.primaryCard}>
            <View style={styles.primaryTop}>
              <View style={styles.primaryIcon}><Dumbbell color={colors.cyan} size={22} /></View>
              <View style={styles.primaryState}><View style={styles.primaryStateDot} /><Text style={styles.primaryStateText}>{data.todayWorkout ? t.home.readyState : t.home.pendingState}</Text></View>
            </View>
            <Text style={styles.cardEyebrow}>{t.home.workout}</Text>
            <Text style={styles.primaryTitle}>{data.todayWorkout?.title ?? t.home.workoutPending}</Text>
            <Text style={styles.primaryMeta}>{data.todayWorkout ? `${data.todayWorkout.minutes} min  ·  ${data.todayWorkout.exerciseCount} ${t.home.exercises}${data.todayWorkout.focus ? `  ·  ${data.todayWorkout.focus}` : ""}` : data.program?.name ?? t.common.preparing}</Text>
            <Pressable onPress={() => router.push("/(tabs)/plan")} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
              <Text style={styles.primaryActionText}>{data.todayWorkout ? t.home.startWorkout : t.home.viewWeek}</Text><ChevronRight color={colors.ink} size={18} />
            </Pressable>
          </LinearGradient>

          <View style={styles.routeLabelRow}><View style={styles.routeNode}><Text style={styles.routeNodeText}>2</Text></View><Text style={styles.routeMoment}>{t.home.after}</Text></View>

          <Pressable onPress={() => router.push("/(tabs)/plan")} style={styles.routeCard}>
            <View style={styles.routeIcon}><Salad color={colors.success} size={21} /></View>
            <View style={styles.routeCopy}>
              <Text style={styles.routeTitle}>{data.nutrition ? t.home.nutritionReady : t.home.nutritionPending}</Text>
              <Text style={styles.routeMeta}>{data.nutrition ? `${data.nutrition.mealsPerDay} comidas · ${data.nutrition.targetCalories ?? "—"} kcal` : t.common.preparing}</Text>
            </View>
            <ChevronRight color={colors.textSoft} size={18} />
          </Pressable>

          <View style={styles.routeLabelRow}><View style={styles.routeNode}><Text style={styles.routeNodeText}>3</Text></View><Text style={styles.routeMoment}>{t.home.habits}</Text></View>

          <View style={styles.habitCard}>
            <View style={styles.habitHead}>
              <View><Text style={styles.routeTitle}>{t.home.habits}</Text><Text style={styles.routeMeta}>{data.habits.length ? `${completedHabits} de ${data.habits.length} ${t.home.completed}` : t.home.habitsEmpty}</Text></View>
              <Text style={styles.habitScore}>{data.habits.length ? `${completedHabits}/${data.habits.length}` : "—"}</Text>
            </View>
            {data.habits.map((habit) => (
              <Pressable key={habit.id} onPress={() => toggleHabit(habit.id, !habit.done)} style={[styles.habitRow, habit.done && styles.habitDone]}>
                <View style={[styles.check, habit.done && styles.checkDone]}>{habit.done ? <Check color={colors.ink} size={14} strokeWidth={3} /> : null}</View>
                <Text style={[styles.habitName, habit.done && styles.habitNameDone]}>{habit.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.metricRow}>
          <Metric label={t.home.sessions} value={String(data.sessionBalance.remaining)} accent />
          <Metric label={t.home.program} value={data.program ? `${t.home.week} ${data.program.currentWeek}` : "—"} />
        </View>

        <View style={styles.programCard}>
          <View style={styles.programTop}>
            <View><Text style={styles.programLabel}>{t.home.program.toUpperCase()}</Text><Text style={styles.programName}>{data.program?.name ?? t.common.preparing}</Text></View>
            <Text style={styles.programPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
          <View style={styles.programBottom}>
            <View style={styles.programBottomLeft}><CalendarClock color={colors.textSoft} size={17} /><Text style={styles.programBottomLabel}>{t.home.checkin}</Text></View>
            <Text style={styles.programBottomValue}>{data.program?.nextReviewOn ? formatDay(`${data.program.nextReviewOn}T12:00:00`, { day: "numeric", month: "short" }) : "—"}</Text>
          </View>
        </View>

        <View style={styles.sessionCard}>
          <CircleUserRound color={colors.accent} size={22} />
          <View style={styles.sessionCopy}><Text style={styles.sessionLabel}>{t.home.nextSession}</Text><Text style={styles.sessionValue}>{data.nextSession ? formatDay(data.nextSession.startsAt, { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : t.home.noSession}</Text>{data.nextSession?.location ? <Text style={styles.sessionLocation}>{data.nextSession.location}</Text> : null}</View>
          <ChevronRight color={colors.textSoft} size={18} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: 112 },
  intro: { paddingTop: spacing.xl, flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  date: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.1 },
  greeting: { color: colors.text, fontFamily: typography.display, fontSize: 38, lineHeight: 42, marginTop: 3 },
  introCopy: { color: colors.textMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 19, maxWidth: 285 },
  coachButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  syncLine: { marginTop: spacing.md, flexDirection: "row", alignItems: "center", gap: 6 },
  syncLineText: { color: colors.textSoft },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  routeHeader: { marginTop: spacing.xxl, marginBottom: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeEyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.35 },
  readyPill: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  readyPillText: { color: colors.cyan },
  route: { position: "relative" },
  routeLine: { position: "absolute", left: 14, top: 15, bottom: 28, width: 1, backgroundColor: colors.line },
  routeLabelRow: { height: 34, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  routeNodeActive: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", zIndex: 2 },
  routeNodeActiveText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 11 },
  routeNode: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center", zIndex: 2 },
  routeNodeText: { color: colors.text },
  routeMoment: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  primaryCard: { marginLeft: 44, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: "#24547C", padding: spacing.md, overflow: "hidden" },
  primaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  primaryIcon: { width: 43, height: 43, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#0D2C48", borderWidth: 1, borderColor: "#1B5C8D" },
  primaryState: { flexDirection: "row", alignItems: "center", gap: 6 },
  primaryStateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  primaryStateText: { color: colors.success, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.9 },
  cardEyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase" },
  primaryTitle: { color: colors.text, fontFamily: typography.display, fontSize: 31, lineHeight: 33, marginTop: 4 },
  primaryMeta: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 5 },
  primaryAction: { minHeight: 49, marginTop: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.accent },
  primaryActionText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 13 },
  pressed: { opacity: 0.82 },
  routeCard: { marginLeft: 44, marginBottom: spacing.md, minHeight: 79, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  routeIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#112A21", alignItems: "center", justifyContent: "center" },
  routeCopy: { flex: 1 },
  routeTitle: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 14 },
  routeMeta: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginTop: 2 },
  habitCard: { marginLeft: 44, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.xs },
  habitHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  habitScore: { color: colors.cyan, fontFamily: typography.display, fontSize: 25 },
  habitRow: { minHeight: 42, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm },
  habitDone: { backgroundColor: "#10261D" },
  check: { width: 21, height: 21, borderRadius: 7, borderWidth: 1, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  habitName: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 12 },
  habitNameDone: { color: colors.textMuted, textDecorationLine: "line-through" },
  metricRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  programCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  programTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  programLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.1 },
  programName: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 13, marginTop: 4, maxWidth: 250 },
  programPercent: { color: colors.cyan, fontFamily: typography.display, fontSize: 25 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: colors.surfaceSoft, marginVertical: spacing.md },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.accent },
  programBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  programBottomLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  programBottomLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 11 },
  programBottomValue: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 12 },
  sessionCard: { marginTop: spacing.sm, minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  sessionCopy: { flex: 1, gap: 2 },
  sessionLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" },
  sessionValue: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 13 },
  sessionLocation: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11 },
});
