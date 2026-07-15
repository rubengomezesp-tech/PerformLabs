import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { Eye, LockKeyhole, Mail } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandBar, Eyebrow } from "@/src/components/ui";
import { t } from "@/src/i18n";
import { useAuth } from "@/src/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function SignInScreen() {
  const { demoMode, enterDemo, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  if (demoMode || session) return <Redirect href="/(tabs)" />;

  async function submit() {
    setSubmitting(true);
    setError(false);
    try {
      await signIn(email, password);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <BrandBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.body}>
        <LinearGradient colors={["#102F4D", "#0B151F", colors.ink]} style={styles.glow} />
        <View style={styles.intro}>
          <Eyebrow>{t.auth.eyebrow}</Eyebrow>
          <Text style={styles.title}>{t.auth.title}</Text>
          <Text style={styles.copy}>{t.auth.text}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Mail color={colors.textSoft} size={18} />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t.auth.email}
              placeholderTextColor={colors.textSoft}
              style={styles.input}
              value={email}
            />
          </View>
          <View style={styles.field}>
            <LockKeyhole color={colors.textSoft} size={18} />
            <TextInput
              autoCapitalize="none"
              autoComplete="current-password"
              onChangeText={setPassword}
              placeholder={t.auth.password}
              placeholderTextColor={colors.textSoft}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          {error ? <Text style={styles.error}>{t.auth.error}</Text> : null}
          <Pressable disabled={submitting || !email || !password} onPress={submit} style={({ pressed }) => [styles.action, pressed && styles.pressed, (submitting || !email || !password) && styles.disabled]}>
            <Text style={styles.actionText}>{submitting ? t.auth.loading : t.auth.action}</Text>
          </Pressable>
          <Pressable disabled={submitting} onPress={enterDemo} style={({ pressed }) => [styles.demoAction, pressed && styles.pressed]}>
            <Eye color={colors.cyan} size={17} />
            <View style={styles.demoCopy}><Text style={styles.demoActionText}>{t.auth.demoAction}</Text><Text style={styles.demoHint}>{t.auth.demoHint}</Text></View>
          </Pressable>
          <View style={styles.secure}><LockKeyhole color={colors.success} size={14} /><Text style={styles.secureText}>{t.auth.secure}</Text></View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  body: { flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, overflow: "hidden" },
  glow: { position: "absolute", top: -40, left: -90, right: -90, height: 380, borderBottomLeftRadius: 190, borderBottomRightRadius: 190, opacity: 0.88 },
  intro: { marginBottom: spacing.xxl, gap: spacing.sm },
  title: { color: colors.text, fontFamily: typography.display, fontSize: 56, lineHeight: 54, letterSpacing: -0.8, maxWidth: 330 },
  copy: { color: colors.textMuted, fontFamily: typography.body, fontSize: 15, lineHeight: 23, maxWidth: 330 },
  form: { gap: spacing.sm, padding: spacing.md, backgroundColor: "rgba(14,18,22,0.96)", borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg },
  field: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.ink, borderRadius: radius.md },
  input: { flex: 1, color: colors.text, fontFamily: typography.bodyMedium, fontSize: 15, paddingVertical: 0 },
  action: { minHeight: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent, borderRadius: radius.md, marginTop: spacing.xs },
  actionText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 15 },
  demoAction: { minHeight: 54, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: "#24547C", backgroundColor: "#0D1A24", borderRadius: radius.md },
  demoCopy: { flex: 1 },
  demoActionText: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 13 },
  demoHint: { color: colors.textSoft, fontFamily: typography.body, fontSize: 10, marginTop: 2 },
  error: { color: colors.danger, fontFamily: typography.bodyMedium, fontSize: 12, lineHeight: 17 },
  secure: { flexDirection: "row", gap: spacing.xs, justifyContent: "center", alignItems: "center", paddingTop: spacing.xs },
  secureText: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.42 },
});
