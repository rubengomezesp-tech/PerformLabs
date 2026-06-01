import type { Database, Json } from "@/lib/supabase/database.types";

// The MCP type generator emits only `Json` and `Database`, so re-export the
// conventional row/insert/update/enum helpers here for ergonomic typing of
// query payloads across the repositories.
export type { Json };

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
