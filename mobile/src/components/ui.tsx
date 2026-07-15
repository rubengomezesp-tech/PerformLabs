import type { ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, RefreshCw } from "lucide-react-native";
import { t } from "@/src/i18n";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <SafeAreaView edges={["top"]} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function BrandBar({ demo = false }: { demo?: boolean }) {
  return (
    <View style={styles.brandBar}>
      <View style={styles.brandIdentity}>
        <Image source={require("../../assets/images/icon.png")} style={styles.brandIcon} />
        <View>
          <Text style={styles.brandEyebrow}>{t.auth.eyebrow}</Text>
          <Text style={styles.brandName}>RG COACH</Text>
        </View>
      </View>
      <View style={[styles.connectionPill, demo && styles.demoPill]}>
        <View style={[styles.connectionDot, demo && styles.demoDot]} />
        <Text style={styles.connectionText}>{demo ? t.common.demo.toUpperCase() : t.home.live.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function PrimaryButton({ children, style, ...props }: PressableProps & { children: ReactNode }) {
  return (
    <Pressable {...props} style={(state) => [styles.primaryButton, state.pressed && styles.pressed, typeof style === "function" ? style(state) : style]}>
      <Text style={styles.primaryButtonText}>{children}</Text>
      <ArrowRight color={colors.ink} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

export function LoadingState() {
  return (
    <View style={styles.stateWrap}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.stateText}>Preparando tu día…</Text>
    </View>
  );
}

export function ErrorState({ title, text, retry }: { title: string; text: string; retry(): void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.errorMark}><Text style={styles.errorMarkText}>!</Text></View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
      <Pressable onPress={retry} style={styles.retryButton}>
        <RefreshCw color={colors.text} size={16} />
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

export function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  brandBar: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  brandIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: { width: 36, height: 36, borderRadius: 9 },
  brandEyebrow: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.2 },
  brandName: { color: colors.text, fontFamily: typography.display, fontSize: 20, letterSpacing: 0.7 },
  connectionPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: "#1B6045", paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#0B241B" },
  demoPill: { borderColor: "#665229", backgroundColor: "#241D0E" },
  connectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  demoDot: { backgroundColor: colors.warning },
  connectionText: { color: colors.textMuted, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.8 },
  eyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 11, letterSpacing: 1.35 },
  primaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  primaryButtonText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 15 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  stateWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl, gap: spacing.sm },
  stateTitle: { color: colors.text, fontFamily: typography.display, fontSize: 32, textAlign: "center" },
  stateText: { color: colors.textMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 21, textAlign: "center" },
  errorMark: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#35141C", borderWidth: 1, borderColor: colors.danger },
  errorMarkText: { color: colors.danger, fontFamily: typography.bodyBold, fontSize: 21 },
  retryButton: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.xs, alignItems: "center", borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 13 },
  metric: { flex: 1, minHeight: 83, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line, padding: spacing.md, justifyContent: "space-between" },
  metricLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  metricValue: { color: colors.text, fontFamily: typography.display, fontSize: 27 },
  metricAccent: { color: colors.cyan },
});
