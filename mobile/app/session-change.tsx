import { router } from "expo-router";
import { CalendarClock, ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandBar, Screen } from "@/src/components/ui";
import { t } from "@/src/i18n";
import { useMemberHome } from "@/src/providers/member-home-provider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function two(value: number) { return String(value).padStart(2, "0"); }

export default function SessionChangeScreen() {
  const { data, requestSessionChange } = useMemberHome();
  const initial = useMemo(() => {
    const date = data?.nextSession ? new Date(data.nextSession.startsAt) : new Date(Date.now() + 86_400_000);
    return { date: `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`, time: `${two(date.getHours())}:${two(date.getMinutes())}` };
  }, [data?.nextSession]);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const requested = new Date(`${date}T${time}:00`);
    if (Number.isNaN(requested.getTime()) || requested.getTime() <= Date.now()) {
      Alert.alert(t.sessionChange.invalidTitle, t.sessionChange.invalidText);
      return;
    }
    setSending(true);
    try {
      await requestSessionChange(requested.toISOString(), message);
      Alert.alert(t.sessionChange.sentTitle, t.sessionChange.sentText, [{ text: t.sessionChange.done, onPress: () => router.back() }]);
    } catch {
      Alert.alert(t.sessionChange.errorTitle, t.sessionChange.errorText);
    } finally {
      setSending(false);
    }
  }

  return <Screen>
    <BrandBar demo={data?.source === "demo"} />
    <View style={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ChevronLeft color={colors.text} size={19} /><Text style={styles.backText}>{t.sessionChange.back}</Text></Pressable>
      <View style={styles.icon}><CalendarClock color={colors.cyan} size={25} /></View>
      <Text style={styles.eyebrow}>{t.sessionChange.eyebrow}</Text>
      <Text style={styles.title}>{t.sessionChange.title}</Text>
      <Text style={styles.text}>{t.sessionChange.text}</Text>
      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.field}><Text style={styles.label}>{t.sessionChange.date}</Text><TextInput autoCapitalize="none" keyboardType="numbers-and-punctuation" onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSoft} style={styles.input} value={date} /></View>
          <View style={styles.fieldSmall}><Text style={styles.label}>{t.sessionChange.time}</Text><TextInput autoCapitalize="none" keyboardType="numbers-and-punctuation" onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={colors.textSoft} style={styles.input} value={time} /></View>
        </View>
        <View style={styles.field}><Text style={styles.label}>{t.sessionChange.note}</Text><TextInput multiline onChangeText={setMessage} placeholder={t.sessionChange.notePlaceholder} placeholderTextColor={colors.textSoft} style={[styles.input, styles.note]} textAlignVertical="top" value={message} /></View>
        <View style={styles.protection}><ShieldCheck color={colors.success} size={17} /><Text style={styles.protectionText}>{t.sessionChange.protection}</Text></View>
        <Pressable accessibilityRole="button" disabled={sending} onPress={submit} style={({ pressed }) => [styles.submit, (pressed || sending) && styles.pressed]}><Text style={styles.submitText}>{sending ? t.sessionChange.sending : t.sessionChange.submit}</Text></Pressable>
      </View>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, paddingTop: spacing.md },
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, minHeight: 42 },
  backText: { color: colors.text, fontFamily: typography.bodyBold, fontSize: 12 },
  icon: { width: 48, height: 48, marginTop: spacing.xl, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  eyebrow: { marginTop: spacing.md, color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.2 },
  title: { marginTop: 5, color: colors.text, fontFamily: typography.display, fontSize: 38, lineHeight: 41 },
  text: { marginTop: 6, maxWidth: 330, color: colors.textMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 20 },
  form: { marginTop: spacing.xl, gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  field: { flex: 1, gap: 7 },
  fieldSmall: { width: 112, gap: 7 },
  label: { color: colors.textMuted, fontFamily: typography.bodyBold, fontSize: 11 },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, fontFamily: typography.body, fontSize: 14 },
  note: { minHeight: 100, paddingTop: spacing.md },
  protection: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#10261D", borderWidth: 1, borderColor: "#1E5039" },
  protectionText: { flex: 1, color: colors.textMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17 },
  submit: { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  submitText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 14 },
  pressed: { opacity: .76 },
});
