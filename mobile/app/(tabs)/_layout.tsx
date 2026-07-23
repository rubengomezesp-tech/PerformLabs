import { Redirect, Tabs } from "expo-router";
import { Dumbbell, Gauge, House, UserRound } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { t } from "@/src/i18n";
import { useAuth } from "@/src/providers/auth-provider";
import { colors, typography } from "@/src/theme/tokens";

export default function TabLayout() {
  const { demoMode, loading, session } = useAuth();

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (!demoMode && !session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.today,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: t.tabs.plan,
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen name="progress" options={{ title: t.tabs.progress, tabBarIcon: ({ color, size }) => <Gauge color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  tabBar: { height: 78, paddingTop: 8, paddingBottom: 10, backgroundColor: "#0A0D10", borderTopColor: colors.line },
  tabLabel: { fontFamily: typography.bodyMedium, fontSize: 10 },
});
