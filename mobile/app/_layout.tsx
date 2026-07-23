import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider } from "@/src/providers/auth-provider";
import { MemberHomeProvider } from "@/src/providers/member-home-provider";
import { colors } from "@/src/theme/tokens";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 320, fade: true });

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <MemberHomeProvider>
        <StatusBar style="light" />
        <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.ink, card: colors.surface, border: colors.line, primary: colors.accent, text: colors.text } }}>
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.ink }, headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
            <Stack.Screen name="session-change" options={{ animation: "slide_from_right" }} />
          </Stack>
        </ThemeProvider>
      </MemberHomeProvider>
    </AuthProvider>
  );
}
