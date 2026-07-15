import { Camera, ChartNoAxesCombined, Ruler, Scale } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandBar, Eyebrow, Screen } from "@/src/components/ui";
import { t } from "@/src/i18n";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

const nextModules = [
  { icon: Scale, label: "Peso y tendencia" },
  { icon: Camera, label: "Fotos de progreso" },
  { icon: Ruler, label: "Medidas corporales" },
  { icon: ChartNoAxesCombined, label: "Check-in semanal" },
];

export default function ProgressScreen() {
  const { data } = useMemberHome();
  return (
    <Screen>
      <BrandBar demo={data?.source === "demo"} />
      <ScrollView contentContainerStyle={styles.content}>
        <Eyebrow>{t.progress.eyebrow}</Eyebrow>
        <Text style={styles.title}>{t.progress.title}</Text>
        <Text style={styles.copy}>{t.progress.text}</Text>
        <View style={styles.release}><Text style={styles.releaseLabel}>{t.progress.next.toUpperCase()}</Text><Text style={styles.releaseNumber}>02</Text></View>
        <View style={styles.grid}>
          {nextModules.map(({ icon: Icon, label }) => <View key={label} style={styles.module}><Icon color={colors.accent} size={22} /><Text style={styles.moduleText}>{label}</Text></View>)}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 112 },
  title: { color: colors.text, fontFamily: typography.display, fontSize: 49, lineHeight: 48, marginTop: spacing.xs, maxWidth: 330 },
  copy: { color: colors.textMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 22, marginTop: spacing.sm, maxWidth: 340 },
  release: { marginTop: spacing.xxl, paddingBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line },
  releaseLabel: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.1 },
  releaseNumber: { color: colors.textSoft, fontFamily: typography.display, fontSize: 21 },
  grid: { gap: spacing.sm, marginTop: spacing.md },
  module: { minHeight: 70, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  moduleText: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 14 },
});
