import {
  Apple,
  Bell,
  BookOpen,
  CreditCard,
  Dumbbell,
  FileVideo,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShoppingCart,
  Users,
  Wand2,
} from "lucide-react";

export type PlatformModule = {
  area: string;
  key: string;
  title: string;
  description: string;
  phase: "base" | "mvp" | "fase-2" | "premium";
  tables: string[];
};

export type AppSettingDefinition = {
  group: string;
  key: string;
  label: string;
  valueType: "text" | "boolean" | "number" | "color" | "url" | "select" | "json";
  defaultValue: string | boolean | number | Record<string, unknown>;
};

export type NotificationEventDefinition = {
  key: string;
  title: string;
  channels: Array<"email" | "push" | "in_app">;
  defaultEnabled: boolean;
  payload: string[];
};

export type GeneratorFieldDefinition = {
  key: string;
  label: string;
  fieldType: "text" | "number" | "select" | "multi-select" | "boolean";
  required: boolean;
};

export const platformModules: PlatformModule[] = [
  {
    area: "Cuentas",
    key: "accounts.team",
    title: "Equipo y roles",
    description: "Managers, coaches, staff, permisos por marca e impersonacion controlada.",
    phase: "mvp",
    tables: ["workspace_memberships"],
  },
  {
    area: "Cuentas",
    key: "accounts.customers",
    title: "Clientes",
    description: "Ficha, estado, filtros, preferencias, progreso, planes asignados y exportacion.",
    phase: "mvp",
    tables: ["member_profiles", "member_subscriptions", "customer_checkins"],
  },
  {
    area: "Ajustes",
    key: "settings.general",
    title: "General white-label",
    description: "Logo, dominio, soporte, PWA, contraseña maestra, net carbs y foto por defecto.",
    phase: "base",
    tables: ["workspaces", "app_settings"],
  },
  {
    area: "Ajustes",
    key: "settings.subscription",
    title: "Onboarding y suscripcion",
    description: "Activacion, medicion, genero por defecto, edad minima, pausa y trackers.",
    phase: "mvp",
    tables: ["app_settings", "member_subscriptions"],
  },
  {
    area: "Fitness",
    key: "fitness.library",
    title: "Biblioteca de ejercicios",
    description: "Biblioteca global, ejercicios propios, grupos musculares, equipo, ubicacion y lesiones.",
    phase: "mvp",
    tables: ["exercise_categories", "exercises", "exercise_videos"],
  },
  {
    area: "Fitness",
    key: "fitness.builder",
    title: "Workout builder",
    description: "Programas, semanas, dias, sesiones, swaps, tempo, descanso y versiones.",
    phase: "mvp",
    tables: ["workout_templates", "workout_template_days", "workout_template_exercises", "assigned_workout_plans"],
  },
  {
    area: "Nutricion",
    key: "nutrition.catalog",
    title: "Catalogo nutricional",
    description: "Categorias, cocinas, ingredientes, recetas, unidades, tags, alergias y restricciones.",
    phase: "mvp",
    tables: ["diet_categories", "ingredients", "recipes", "recipe_ingredients"],
  },
  {
    area: "Nutricion",
    key: "nutrition.generator",
    title: "Generador de comidas",
    description: "Calorias, macros, preferencias, recetas, alergias, disliked foods y lista de compra.",
    phase: "mvp",
    tables: ["nutrition_formulas", "diet_templates", "assigned_meal_plans"],
  },
  {
    area: "Productos",
    key: "commerce.products",
    title: "Productos y precios",
    description: "Productos comerciales, modulos incluidos, precios, trials, cupones y pasarela de pago.",
    phase: "fase-2",
    tables: ["product_catalog_items", "pricing_plans", "coupons", "member_subscriptions"],
  },
  {
    area: "Area de miembros",
    key: "member-area.pages",
    title: "Constructor de app",
    description: "Paginas, menus, banners, welcome messages, video library y file library.",
    phase: "mvp",
    tables: ["app_pages", "app_banners", "content_pages", "media_files"],
  },
  {
    area: "Comunidad",
    key: "community.chat",
    title: "Chat y comunidad",
    description: "Canales, soporte, moderacion, reportes, mensajes privados y futuras salas.",
    phase: "fase-2",
    tables: ["notification_templates"],
  },
  {
    area: "Herramientas",
    key: "tools.automation",
    title: "Automatizaciones",
    description: "Generadores, notificaciones programadas, delete requests y tareas bajo demanda.",
    phase: "premium",
    tables: ["scheduled_notifications", "audit_log"],
  },
];

export const appSettingDefinitions: AppSettingDefinition[] = [
  { group: "general", key: "brand.logo_url", label: "Logo", valueType: "url", defaultValue: "" },
  { group: "general", key: "brand.favicon_url", label: "Favicon", valueType: "url", defaultValue: "" },
  { group: "general", key: "brand.signature_url", label: "Firma del coach", valueType: "url", defaultValue: "" },
  { group: "general", key: "brand.header_image_url", label: "Imagen de cabecera", valueType: "url", defaultValue: "" },
  { group: "general", key: "support.reactivation_url", label: "URL reactivacion", valueType: "url", defaultValue: "" },
  { group: "general", key: "support.website_url", label: "Web publica", valueType: "url", defaultValue: "" },
  { group: "general", key: "access.master_password_enabled", label: "Contraseña maestra", valueType: "boolean", defaultValue: false },
  { group: "general", key: "nutrition.show_net_carbs", label: "Carbohidratos netos visibles", valueType: "boolean", defaultValue: false },
  { group: "pwa", key: "pwa.enabled", label: "PWA activa", valueType: "boolean", defaultValue: true },
  { group: "pwa", key: "pwa.short_name", label: "Nombre corto PWA", valueType: "text", defaultValue: "PerformLabs" },
  { group: "pwa", key: "pwa.description", label: "Descripcion PWA", valueType: "text", defaultValue: "Performance coaching app" },
  { group: "pwa", key: "pwa.theme_color", label: "Theme color", valueType: "color", defaultValue: "#078df2" },
  { group: "pwa", key: "pwa.icon_url", label: "Icono PWA", valueType: "url", defaultValue: "" },
  { group: "pwa", key: "pwa.maskable_icon_url", label: "Icono PWA adaptable", valueType: "url", defaultValue: "" },
  { group: "subscription", key: "subscription.activation_delay_min_days", label: "Activacion minima", valueType: "number", defaultValue: 0 },
  { group: "subscription", key: "subscription.activation_delay_max_days", label: "Activacion maxima", valueType: "number", defaultValue: 7 },
  { group: "subscription", key: "subscription.default_measurement_system", label: "Sistema medicion", valueType: "select", defaultValue: "metric" },
  { group: "subscription", key: "subscription.default_gender", label: "Genero por defecto", valueType: "select", defaultValue: "not_set" },
  { group: "subscription", key: "subscription.minimum_age", label: "Edad minima", valueType: "number", defaultValue: 16 },
  { group: "subscription", key: "subscription.allow_pause", label: "Permitir pausa", valueType: "boolean", defaultValue: true },
  { group: "subscription", key: "tracker.habit_enabled", label: "Habit tracker", valueType: "boolean", defaultValue: true },
  { group: "subscription", key: "tracker.period_enabled", label: "Period tracker", valueType: "boolean", defaultValue: true },
  { group: "subscription", key: "progress.body_fat_question_enabled", label: "Pregunta grasa corporal", valueType: "boolean", defaultValue: true },
  { group: "fitness", key: "fitness.exercise_swaps_enabled", label: "Swaps de ejercicio", valueType: "boolean", defaultValue: true },
  { group: "fitness", key: "fitness.static_swaps_enabled", label: "Swaps estaticos", valueType: "boolean", defaultValue: true },
  { group: "fitness", key: "fitness.exercise_audio_enabled", label: "Audio de ejercicio", valueType: "boolean", defaultValue: false },
  { group: "fitness", key: "fitness.injuries_field_enabled", label: "Campo lesiones", valueType: "boolean", defaultValue: true },
  { group: "fitness", key: "fitness.workout_log_enabled", label: "Workout log", valueType: "boolean", defaultValue: true },
  { group: "nutrition", key: "nutrition.preferred_cuisine_enabled", label: "Cocina preferida", valueType: "boolean", defaultValue: true },
  { group: "nutrition", key: "nutrition.preferred_recipes_enabled", label: "Recetas preferidas", valueType: "boolean", defaultValue: true },
  { group: "nutrition", key: "nutrition.allergies_enabled", label: "Alergias y no me gusta", valueType: "boolean", defaultValue: true },
  { group: "nutrition", key: "nutrition.product_name_visible", label: "Mostrar producto/plan", valueType: "boolean", defaultValue: true },
  { group: "nutrition", key: "nutrition.member_adjustments_enabled", label: "Cliente puede ajustar plan", valueType: "boolean", defaultValue: false },
  { group: "nutrition", key: "nutrition.variety_tags_enabled", label: "Variety tags", valueType: "boolean", defaultValue: true },
];

export const notificationEvents: NotificationEventDefinition[] = [
  { key: "customer.account_created", title: "Cuenta de cliente creada", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "workspace"] },
  { key: "customer.account_activated", title: "Cuenta activada", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "subscription"] },
  { key: "customer.account_deactivated", title: "Cuenta desactivada", channels: ["email", "in_app"], defaultEnabled: true, payload: ["member", "reason"] },
  { key: "payment.succeeded", title: "Pago correcto", channels: ["email", "in_app"], defaultEnabled: true, payload: ["member", "amount", "invoice"] },
  { key: "payment.failed", title: "Pago fallido", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "retry_url"] },
  { key: "checkin.reviewed", title: "Check-in revisado por el coach", channels: ["push", "in_app"], defaultEnabled: true, payload: ["member", "checkin"] },
  { key: "plan.published", title: "Plan publicado", channels: ["push", "in_app"], defaultEnabled: true, payload: ["member", "plan"] },
  { key: "progress.update_due", title: "Check-in pendiente", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "due_date"] },
  { key: "progress.update_overdue", title: "Check-in atrasado", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "days_overdue"] },
  { key: "meal.swap_succeeded", title: "Cambio de comida generado", channels: ["push", "in_app"], defaultEnabled: true, payload: ["member", "meal"] },
  { key: "meal.swap_failed", title: "Cambio de comida fallido", channels: ["in_app"], defaultEnabled: true, payload: ["member", "reason"] },
  { key: "fitness.exercise_swap_requested", title: "Solicitud de swap de ejercicio", channels: ["push", "in_app"], defaultEnabled: true, payload: ["member", "exercise", "injury"] },
  { key: "progress.photo_uploaded", title: "Foto de progreso subida", channels: ["push", "in_app"], defaultEnabled: true, payload: ["member", "photo_type"] },
  { key: "nutrition.plan_activated", title: "Plan nutricional activado", channels: ["email", "push", "in_app"], defaultEnabled: true, payload: ["member", "plan"] },
  { key: "nutrition.generation_failed", title: "Generacion nutricional fallida", channels: ["in_app"], defaultEnabled: true, payload: ["member", "reason"] },
  { key: "community.moderation_reported", title: "Reporte de comunidad", channels: ["in_app"], defaultEnabled: true, payload: ["report", "workspace"] },
  { key: "account.delete_requested", title: "Solicitud de borrado", channels: ["email", "in_app"], defaultEnabled: true, payload: ["member", "requested_at"] },
];

export const mealGeneratorFields: GeneratorFieldDefinition[] = [
  { key: "dietPreference", label: "Preferencia de dieta", fieldType: "select", required: true },
  { key: "goal", label: "Objetivo", fieldType: "select", required: true },
  { key: "mealsPerDay", label: "Comidas por dia", fieldType: "number", required: true },
  { key: "days", label: "Numero de dias", fieldType: "number", required: true },
  { key: "heightCm", label: "Altura", fieldType: "number", required: true },
  { key: "weightKg", label: "Peso", fieldType: "number", required: true },
  { key: "bodyFatPercentage", label: "Grasa corporal", fieldType: "number", required: false },
  { key: "measurementSystem", label: "Sistema metrico", fieldType: "select", required: true },
  { key: "age", label: "Edad", fieldType: "number", required: true },
  { key: "gender", label: "Genero", fieldType: "select", required: true },
  { key: "activityLevel", label: "Nivel de actividad", fieldType: "select", required: true },
  { key: "vegetarianDays", label: "Dias vegetarianos", fieldType: "number", required: false },
  { key: "cuisines", label: "Cocinas preferidas", fieldType: "multi-select", required: false },
  { key: "preferredRecipes", label: "Recetas preferidas", fieldType: "multi-select", required: false },
  { key: "allergies", label: "Alergias", fieldType: "multi-select", required: false },
  { key: "favoriteMeals", label: "Comidas favoritas", fieldType: "multi-select", required: false },
  { key: "dislikedMeals", label: "Comidas no gustadas", fieldType: "multi-select", required: false },
];

export const workoutGeneratorFields: GeneratorFieldDefinition[] = [
  { key: "goals", label: "Metas", fieldType: "multi-select", required: true },
  { key: "session", label: "Sesion", fieldType: "select", required: true },
  { key: "gender", label: "Genero", fieldType: "select", required: false },
  { key: "weeks", label: "Semanas", fieldType: "number", required: true },
  { key: "daysPerWeek", label: "Dias", fieldType: "number", required: true },
  { key: "programSet", label: "Program set", fieldType: "select", required: false },
  { key: "experience", label: "Nivel de experiencia", fieldType: "select", required: true },
  { key: "location", label: "Ubicacion", fieldType: "select", required: true },
  { key: "period", label: "Periodo", fieldType: "select", required: false },
  { key: "periodDuration", label: "Duracion de periodo", fieldType: "number", required: false },
];

export const defaultMemberAppPages = [
  { title: "Panel", route: "/app", pageType: "system", menuArea: "main", sortOrder: 10, isSystem: true },
  { title: "Inicio", route: "/app/onboarding", pageType: "onboarding", menuArea: "main", sortOrder: 15, isSystem: true },
  { title: "Entreno", route: "/app/workouts", pageType: "system", menuArea: "main", sortOrder: 20, isSystem: true },
  { title: "Comida", route: "/app/meals", pageType: "system", menuArea: "main", sortOrder: 30, isSystem: true },
  { title: "Progreso", route: "/app/progress", pageType: "system", menuArea: "main", sortOrder: 40, isSystem: true },
  { title: "Cardio", route: "/app/cardio", pageType: "system", menuArea: "main", sortOrder: 50, isSystem: true },
  { title: "Guias", route: "/app/guides", pageType: "content", menuArea: "main", sortOrder: 60, isSystem: false },
  { title: "Soporte", route: "/app/support", pageType: "support", menuArea: "main", sortOrder: 70, isSystem: true },
  { title: "Perfil", route: "/app/profile", pageType: "profile", menuArea: "main", sortOrder: 80, isSystem: true },
];

export const systemAreas = [
  { title: "Cuentas", icon: Users, modules: platformModules.filter((module) => module.area === "Cuentas") },
  { title: "Ajustes", icon: Settings, modules: platformModules.filter((module) => module.area === "Ajustes") },
  { title: "Fitness", icon: Dumbbell, modules: platformModules.filter((module) => module.area === "Fitness") },
  { title: "Nutricion", icon: Apple, modules: platformModules.filter((module) => module.area === "Nutricion") },
  { title: "Productos", icon: CreditCard, modules: platformModules.filter((module) => module.area === "Productos") },
  { title: "Area de miembros", icon: LayoutDashboard, modules: platformModules.filter((module) => module.area === "Area de miembros") },
  { title: "Comunidad", icon: MessageSquare, modules: platformModules.filter((module) => module.area === "Comunidad") },
  { title: "Herramientas", icon: Wand2, modules: platformModules.filter((module) => module.area === "Herramientas") },
];

export const consoleLogicCards = [
  { title: "Configuraciones", value: appSettingDefinitions.length, icon: Settings },
  { title: "Eventos de comunicación", value: notificationEvents.length, icon: Bell },
  { title: "Campos de nutrición", value: mealGeneratorFields.length, icon: ShoppingCart },
  { title: "Campos de entrenamiento", value: workoutGeneratorFields.length, icon: FileVideo },
  { title: "Pantallas móviles", value: defaultMemberAppPages.length, icon: BookOpen },
];
