import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(url && publishableKey && !url.includes("YOUR_PROJECT"));

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
