import { Dumbbell, Salad } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandBar, Eyebrow, ErrorState, LoadingState, Metric, Screen } from "@/src/components/ui";
import { t } from "@/src/i18n";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function PlanScreen() {
  const { data, error, loading, refresh } = useMemberHome();
  if (loading && !data) return <Screen><BrandBar /><LoadingState /></Screen>;
  if (error && !data) return <Screen><BrandBar /><ErrorState title={t.home.errorTitle} text={t.home.errorText} retry={refresh} /></Screen>;
  if (!data) return null;

  return (
    <Screen>
      <BrandBar demo={data.source === "demo"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>{t.plan.eyebrow}</Eyebrow>
        <Text style={styles.title}>{t.plan.title}</Text>
        <Text style={styles.copy}>{t.plan.text}</Text>

        <View style={styles.planBlock}>
          <View style={styles.blockHeader}>
            <View style={styles.trainingIcon}><Dumbbell color={colors.cyan} size={22} /></View>
            <View><Text style={styles.blockLabel}>{t.plan.training.toUpperCase()}</Text><Text style={styles.blockTitle}>{data.program?.name ?? t.plan.awaiting}</Text></View>
          </View>
          <View style={styles.metrics}>
            <Metric label={t.plan.week} value={data.program ? `${data.program.currentWeek}/${data.program.totalWeeks}` : "—"} accent />
            <Metric label={t.home.workout} value={data.todayWorkout ? `${data.todayWorkout.exerciseCount} ejer.` : "—"} />
          </View>
          {data.todayWorkout ? <View style={styles.detail}><Text style={styles.detailLabel}>PRÓXIMA SESIÓN</Text><Text style={styles.detailTitle}>{data.todayWorkout.title}</Text><Text style={styles.detailMeta}>{data.todayWorkout.minutes} min{data.todayWorkout.focus ? ` · ${data.todayWorkout.focus}` : ""}</Text></View> : null}
        </View>

        <View style={styles.planBlock}>
          <View style={styles.blockHeader}>
            <View style={styles.nutritionIcon}><Salad color={colors.success} size={22} /></View>
            <View><Text style={styles.blockLabel}>{t.plan.nutrition.toUpperCase()}</Text><Text style={styles.blockTitle}>{data.nutrition?.name ?? t.plan.awaiting}</Text></View>
          </View>
          <View style={styles.metrics}>
            <Metric label={t.plan.meals} value={data.nutrition ? String(data.nutrition.mealsPerDay) : "—"} />
            <Metric label={t.plan.calories} value={data.nutrition?.targetCalories ? `${data.nutrition.targetCalories}` : "—"} accent />
          </View>
          <View style={styles.nutritionStrip}>
            <Text style={styles.nutritionStripLabel}>{t.plan.protein}</Text>
            <Text style={styles.nutritionStripValue}>{data.nutrition?.targetProteinG ? `${data.nutrition.targetProteinG} g` : "—"}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 112 },
  title: { color: colors.text, fontFamily: typography.display, fontSize: 46, lineHeight: 48, marginTop: spacing.xs },
  copy: { color: colors.textMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 21, marginTop: spacing.xs, marginBottom: spacing.xl, maxWidth: 330 },
  planBlock: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.md },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  trainingIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  nutritionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#112A21" },
  blockLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1 },
  blockTitle: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 14, marginTop: 3, maxWidth: 270 },
  metrics: { flexDirection: "row", gap: spacing.sm },
  detail: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  detailLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.9 },
  detailTitle: { color: colors.text, fontFamily: typography.display, fontSize: 25, marginTop: 5 },
  detailMeta: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, marginTop: 3 },
  nutritionStrip: { marginTop: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  nutritionStripLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 12 },
  nutritionStripValue: { color: colors.success, fontFamily: typography.display, fontSize: 23 },
});
