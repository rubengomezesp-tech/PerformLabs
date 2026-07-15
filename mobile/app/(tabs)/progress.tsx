import { CalendarClock, CheckCircle2, Dumbbell, TrendingUp } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandBar, Eyebrow, Screen } from "@/src/components/ui";
import { programProgress } from "@/src/domain/member-home";
import { t } from "@/src/i18n";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function formatReview(value: string | null | undefined) {
  if (!value) return t.progress.noReview;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default function ProgressScreen() {
  const { data } = useMemberHome();
  if (!data) return <Screen><BrandBar /></Screen>;

  const completedHabits = data.habits.filter((habit) => habit.done).length;
  const habitPercent = data.habits.length ? Math.round((completedHabits / data.habits.length) * 100) : 0;
  const progress = data.program ? Math.round(programProgress(data.program.currentWeek, data.program.totalWeeks) * 100) : 0;
  const metrics = [
    { icon: TrendingUp, label: t.progress.program, value: `${progress}%`, accent: true },
    { icon: CheckCircle2, label: t.progress.adherence, value: data.habits.length ? `${habitPercent}%` : "—" },
    { icon: Dumbbell, label: t.progress.sessions, value: String(data.sessionBalance.remaining) },
    { icon: CalendarClock, label: t.progress.review, value: formatReview(data.program?.nextReviewOn) },
  ];

  return (
    <Screen>
      <BrandBar demo={data.source === "demo"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>{t.progress.eyebrow}</Eyebrow>
        <Text style={styles.title}>{t.progress.title}</Text>
        <Text style={styles.copy}>{t.progress.text}</Text>

        <View style={styles.grid}>
          {metrics.map(({ icon: Icon, label, value, accent }) => (
            <View key={label} style={[styles.metric, accent && styles.metricAccent]}>
              <Icon color={accent ? colors.cyan : colors.textSoft} size={20} />
              <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
              <Text numberOfLines={1} style={[styles.metricValue, accent && styles.metricValueAccent]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.programCard}>
          <Text style={styles.programEyebrow}>{t.progress.currentProgram}</Text>
          <Text style={styles.programName}>{data.program?.name ?? t.progress.noProgram}</Text>
          {data.program ? (
            <>
              <Text style={styles.programWeek}>{t.progress.week} {data.program.currentWeek} {t.progress.of} {data.program.totalWeeks}</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 112 },
  title: { color: colors.text, fontFamily: typography.display, fontSize: 49, lineHeight: 48, marginTop: spacing.xs, maxWidth: 330 },
  copy: { color: colors.textMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 22, marginTop: spacing.sm, maxWidth: 340 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xxl },
  metric: { width: "48%", minHeight: 142, flexGrow: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  metricAccent: { borderColor: "#24547C", backgroundColor: "#0D1A24" },
  metricLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, lineHeight: 13, letterSpacing: 0.8, marginTop: spacing.md },
  metricValue: { color: colors.text, fontFamily: typography.display, fontSize: 29, marginTop: 4 },
  metricValueAccent: { color: colors.cyan },
  programCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceRaised },
  programEyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.1 },
  programName: { color: colors.text, fontFamily: typography.display, fontSize: 28, lineHeight: 31, marginTop: spacing.xs },
  programWeek: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 12, marginTop: spacing.sm },
  progressTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: colors.surfaceSoft, marginTop: spacing.md },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: colors.accent },
});
