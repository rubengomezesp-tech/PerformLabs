import * as WebBrowser from "expo-web-browser";
import { Copy, CreditCard, ExternalLink, LogOut, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandBar, Eyebrow, Metric, Screen } from "@/src/components/ui";
import { t } from "@/src/i18n";
import { useAuth } from "@/src/providers/auth-provider";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { sessionPackCheckoutUrl } from "@/src/services/session-checkout";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { canSignIn, demoMode, leaveDemo, signOut } = useAuth();
  const { data, refresh } = useMemberHome();
  const [openingPayment, setOpeningPayment] = useState(false);
  if (!data) return <Screen><BrandBar demo={demoMode} /></Screen>;
  const memberProfileId = data.member.id;

  async function openSessionCheckout() {
    if (demoMode || openingPayment) return;
    setOpeningPayment(true);
    try {
      await WebBrowser.openBrowserAsync(sessionPackCheckoutUrl(memberProfileId), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.accent,
      });
      await refresh();
    } catch {
      Alert.alert("RG Coach", t.profile.offerError);
    } finally {
      setOpeningPayment(false);
    }
  }

  return (
    <Screen>
      <BrandBar demo={data.source === "demo"} />
      <ScrollView contentContainerStyle={styles.content}>
        <Eyebrow>{t.profile.eyebrow}</Eyebrow>
        <Text style={styles.title}>{t.profile.title}</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{data.member.firstName.slice(0, 1).toUpperCase()}</Text></View>
          <View><Text style={styles.name}>{data.member.fullName}</Text><View style={styles.private}><ShieldCheck color={colors.success} size={13} /><Text style={styles.privateText}>Perfil privado</Text></View></View>
        </View>

        <View style={styles.metricRow}>
          <Metric label={t.profile.balance} value={String(data.sessionBalance.remaining)} accent />
          <Metric label={t.profile.purchased} value={String(data.sessionBalance.purchased)} />
        </View>

        <View style={styles.offerCard}>
          <View style={styles.offerIcon}><CreditCard color={colors.cyan} size={22} /></View>
          <Text style={styles.offerEyebrow}>{t.profile.offerEyebrow}</Text>
          <Text style={styles.offerTitle}>{t.profile.offerTitle}</Text>
          <Text style={styles.offerPrice}>{t.profile.offerPrice}</Text>
          <Text style={styles.offerMeta}>{t.profile.offerMeta}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={demoMode || openingPayment}
            onPress={openSessionCheckout}
            style={({ pressed }) => [styles.buyButton, (demoMode || openingPayment) && styles.buyButtonDisabled, pressed && styles.pressed]}
          >
            {openingPayment ? <ActivityIndicator color={colors.ink} size="small" /> : <CreditCard color={colors.ink} size={18} />}
            <Text style={styles.buyButtonText}>{openingPayment ? t.profile.openingPayment : t.profile.offerAction}</Text>
            {!openingPayment ? <ExternalLink color={colors.ink} size={16} /> : null}
          </Pressable>
          <Text style={styles.offerLegal}>{demoMode ? t.profile.demoOffer : t.profile.offerLegal}</Text>
        </View>

        <View style={styles.idCard}>
          <View><Text style={styles.idLabel}>{t.profile.appUserId.toUpperCase()}</Text><Text numberOfLines={1} style={styles.idValue}>{data.member.id}</Text></View>
          <Copy color={colors.textSoft} size={18} />
        </View>

        {demoMode ? <Text style={styles.demoNotice}>{t.profile.demoNotice}</Text> : null}

        {demoMode && canSignIn ? <Pressable onPress={leaveDemo} style={styles.leaveDemo}><LogOut color={colors.cyan} size={18} /><Text style={styles.leaveDemoText}>{t.profile.leaveDemo}</Text></Pressable> : null}

        {!demoMode ? <Pressable onPress={signOut} style={styles.signOut}><LogOut color={colors.danger} size={18} /><Text style={styles.signOutText}>{t.profile.signOut}</Text></Pressable> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 112 },
  title: { color: colors.text, fontFamily: typography.display, fontSize: 46, lineHeight: 48, marginTop: spacing.xs },
  identity: { marginTop: spacing.xl, minHeight: 88, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.ink, fontFamily: typography.display, fontSize: 29 },
  name: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 15 },
  private: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  privateText: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11 },
  metricRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  offerCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: "#235C88", backgroundColor: "#0D1A24" },
  offerIcon: { width: 43, height: 43, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#0D2C48", borderWidth: 1, borderColor: "#1B5C8D", marginBottom: spacing.md },
  offerEyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.1 },
  offerTitle: { color: colors.text, fontFamily: typography.display, fontSize: 30, lineHeight: 32, marginTop: 4 },
  offerPrice: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 15, marginTop: 4 },
  offerMeta: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  buyButton: { minHeight: 50, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  buyButtonDisabled: { opacity: 0.45 },
  buyButtonText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 13, flex: 1, textAlign: "center" },
  offerLegal: { color: colors.textSoft, fontFamily: typography.body, fontSize: 10, lineHeight: 15, marginTop: spacing.sm },
  pressed: { opacity: 0.82 },
  idCard: { minHeight: 72, marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceRaised, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  idLabel: { color: colors.textSoft, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.9 },
  idValue: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 11, marginTop: 4, maxWidth: 290 },
  demoNotice: { color: colors.warning, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#241D0E", borderWidth: 1, borderColor: "#665229" },
  leaveDemo: { minHeight: 50, marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: "#24547C", backgroundColor: "#0D1A24", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs },
  leaveDemoText: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 13 },
  signOut: { minHeight: 50, marginTop: spacing.xl, borderRadius: radius.md, borderWidth: 1, borderColor: "#5A2630", backgroundColor: "#261117", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs },
  signOutText: { color: colors.danger, fontFamily: typography.bodyBold, fontSize: 13 },
});
