import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Esta pantalla no existe.</Text>
      <Link href="/(tabs)" style={styles.link}>Volver a Hoy</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    fontFamily: typography.display,
    fontSize: 31,
  },
  code: { color: colors.accent, fontFamily: typography.display, fontSize: 72 },
  link: {
    marginTop: 15,
    paddingVertical: spacing.md,
    color: colors.cyan,
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
});
