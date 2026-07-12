import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/lib/supabase/types";
import { appSettingDefinitions } from "@/lib/domain/platform-logic";
import { resolveWorkspaceDomains } from "@/lib/repositories/workspaces";

export type ImplementationProjectSummary = {
  id: string;
  templateId: string;
  workspaceId: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  assignedAgent: string;
  status: string;
  launchTargetDate: string;
  tasks: ProjectTaskSummary[];
  totalTasks: number;
  doneTasks: number;
  createdAt: string;
};

export type ImplementationProjectDetail = ImplementationProjectSummary & {
  brief: ProjectBrief;
};

export type ProjectTaskSummary = {
  id: string;
  projectId: string;
  phase: string;
  title: string;
  description: string;
  status: string;
  sortOrder: number;
  dueDate: string;
  completedAt: string;
};

export type ProjectBrief = {
  id: string;
  projectId: string;
  appName: string;
  domainStrategy: string;
  desiredDomain: string;
  logoStatus: string;
  primaryColor: string;
  accentColor: string;
  brandNotes: string;
  targetAudience: string;
  offerSummary: string;
  pricingNotes: string;
  paymentProvider: string;
  contentNotes: string;
  exerciseVideoNotes: string;
  nutritionNotes: string;
  legalNotes: string;
  launchNotes: string;
  internalRisks: string;
  kickoffCallAt: string;
};

export type TemplateBriefDefaults = {
  templateId: string;
  domainStrategy: string;
  logoStatus: string;
  brandNotes: string;
  targetAudience: string;
  offerSummary: string;
  pricingNotes: string;
  paymentProvider: string;
  contentNotes: string;
  exerciseVideoNotes: string;
  nutritionNotes: string;
  legalNotes: string;
  launchNotes: string;
  internalRisks: string;
};

export type ImplementationTemplateTask = {
  id: string;
  templateId: string;
  phase: string;
  title: string;
  description: string;
  sortOrder: number;
  dayOffset: number;
};

export type ImplementationTemplateSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  buyerType: string;
  estimatedDays: number;
  isActive: boolean;
  sortOrder: number;
  tasks: ImplementationTemplateTask[];
  defaults: TemplateBriefDefaults;
};

export type ProjectUpdateInput = {
  id: string;
  status: string;
  assignedAgent: string;
  launchTargetDate: string;
};

export type ProjectTaskUpdateInput = {
  id: string;
  status: string;
  dueDate: string;
};

export type ProjectBriefInput = Omit<ProjectBrief, "id">;

export type ProjectTaskInput = {
  projectId: string;
  phase: string;
  title: string;
  description: string;
  dueDate: string;
};

export type ImplementationTemplateUpdateInput = {
  id: string;
  name: string;
  description: string;
  buyerType: string;
  estimatedDays: string;
  isActive: string;
};

export type ImplementationTemplateTaskInput = {
  templateId: string;
  phase: string;
  title: string;
  description: string;
  dayOffset: string;
};

export type TemplateBriefDefaultsInput = TemplateBriefDefaults;

const defaultOnboardingTasks = [
  {
    phase: "Requisitos",
    title: "Completar briefing del entrenador",
    description: "Oferta, público objetivo, método, precios y prioridad comercial.",
    sort_order: 10,
    day_offset: 1,
  },
  {
    phase: "Marca",
    title: "Recopilar logo, colores y referencias",
    description: "Identidad visual, tono de marca, nombre de app e iconos.",
    sort_order: 20,
    day_offset: 3,
  },
  {
    phase: "Dominio",
    title: "Coordinar URL personalizada",
    description: "Compra, conexión o decisión del dominio profesional.",
    sort_order: 30,
    day_offset: 5,
  },
  {
    phase: "Contenido",
    title: "Cargar estructura inicial",
    description: "Programas, nutrición, guías, vídeos base y mensajes principales.",
    sort_order: 40,
    day_offset: 10,
  },
  {
    phase: "Pagos",
    title: "Preparar oferta y checkout",
    description: "Planes, precio, producto principal y forma de cobro.",
    sort_order: 50,
    day_offset: 14,
  },
  {
    phase: "Lanzamiento",
    title: "Revisar experiencia completa",
    description: "Pruebas finales, soporte, acceso de clientes y salida operativa.",
    sort_order: 60,
    day_offset: 21,
  },
];

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeHexColor(value?: string) {
  const color = value?.trim() ?? "";
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#078df2";
}

function normalizeDomain(value?: string) {
  return value
    ?.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "")
    .toLowerCase() || "";
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateFromOffset(dayOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

async function recordAuditEvent(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  input: {
    workspaceId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("audit_log").insert({
    workspace_id: input.workspaceId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as Json,
  });
}

async function ensureOperationalWorkspaceAssets(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  input: {
    workspaceId: string;
    workspaceName: string;
    customDomain: string;
    accentColor: string;
    brief: ProjectBrief;
  },
) {
  const appDescription = `${input.workspaceName} app de entrenamiento, nutrición y seguimiento.`;
  const publicUrl = input.customDomain ? `https://${input.customDomain}` : "";
  const settingOverrides: Record<string, string | boolean | number | Record<string, unknown>> = {
    "pwa.short_name": input.workspaceName.slice(0, 24),
    "pwa.description": appDescription,
    "pwa.theme_color": input.accentColor,
    "support.website_url": publicUrl,
  };

  const settingsPayload: TablesInsert<"app_settings">[] = appSettingDefinitions.map((setting) => ({
    workspace_id: input.workspaceId,
    key: setting.key,
    value: (settingOverrides[setting.key] ?? setting.defaultValue) as Json,
    updated_at: new Date().toISOString(),
  }));

  const settingsResult = await supabase
    .from("app_settings")
    .upsert(settingsPayload, { onConflict: "workspace_id,key" });

  if (settingsResult.error) {
    throw new Error(`No se pudo preparar la configuración inicial: ${settingsResult.error.message}`);
  }

  const contentPages: TablesInsert<"content_pages">[] = [
    {
      workspace_id: input.workspaceId,
      title: "Bienvenida",
      slug: "bienvenida",
      status: "draft",
      body: {
        title: `Bienvenido a ${input.workspaceName}`,
        notes: input.brief.contentNotes || "Preparar bienvenida, normas de uso y primeros pasos del cliente.",
      },
    },
    {
      workspace_id: input.workspaceId,
      title: "Soporte",
      slug: "soporte",
      status: "draft",
      body: {
        title: "Soporte",
        notes: "Definir canales, tiempos de respuesta y mensajes iniciales.",
      },
    },
  ];

  const contentResult = await supabase
    .from("content_pages")
    .upsert(contentPages, { onConflict: "workspace_id,slug" })
    .select("id,slug");

  if (contentResult.error) {
    throw new Error(`No se pudo crear el contenido inicial: ${contentResult.error.message}`);
  }

  const contentPageBySlug = new Map((contentResult.data ?? []).map((page) => [page.slug, page.id]));
  const appPages: TablesInsert<"app_pages">[] = [
    { title: "Panel", route: "/app", page_type: "dashboard", menu_area: "main", sort_order: 10, is_system: true },
    { title: "Inicio", route: "/app/onboarding", page_type: "onboarding", menu_area: "main", sort_order: 15, is_system: true, content_page_id: contentPageBySlug.get("bienvenida") ?? null },
    { title: "Entreno", route: "/app/workouts", page_type: "workouts", menu_area: "main", sort_order: 20, is_system: true },
    { title: "Comida", route: "/app/meals", page_type: "nutrition", menu_area: "main", sort_order: 30, is_system: true },
    { title: "Progreso", route: "/app/progress", page_type: "progress", menu_area: "main", sort_order: 40, is_system: true },
    { title: "Guías", route: "/app/guides", page_type: "content", menu_area: "main", sort_order: 50, is_system: true, content_page_id: contentPageBySlug.get("bienvenida") ?? null },
    { title: "Soporte", route: "/app/support", page_type: "support", menu_area: "main", sort_order: 60, is_system: true, content_page_id: contentPageBySlug.get("soporte") ?? null },
    { title: "Perfil", route: "/app/profile", page_type: "profile", menu_area: "main", sort_order: 70, is_system: true },
  ].map((page) => ({
    workspace_id: input.workspaceId,
    status: "draft",
    ...page,
  }));

  const appPagesResult = await supabase
    .from("app_pages")
    .upsert(appPages, { onConflict: "workspace_id,route" });

  if (appPagesResult.error) {
    throw new Error(`No se pudo crear la navegación inicial: ${appPagesResult.error.message}`);
  }

  const existingProduct = await supabase
    .from("product_catalog_items")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .limit(1)
    .maybeSingle();

  if (!existingProduct.data?.id) {
    const productResult = await supabase.from("product_catalog_items").insert({
      workspace_id: input.workspaceId,
      name: input.brief.offerSummary ? "Oferta principal" : `Programa ${input.workspaceName}`,
      description: cleanOptional(input.brief.offerSummary || input.brief.pricingNotes || "Producto principal pendiente de definir."),
      included_modules: ["entrenamiento", "nutricion", "contenido", "soporte"],
      status: "draft",
    });

    if (productResult.error) {
      throw new Error(`No se pudo crear el producto inicial: ${productResult.error.message}`);
    }
  }
}

function mapTask(task: any): ProjectTaskSummary {
  return {
    id: task.id,
    projectId: task.project_id,
    phase: task.phase,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    sortOrder: task.sort_order,
    dueDate: task.due_date ?? "",
    completedAt: task.completed_at ?? "",
  };
}

function mapTemplateTask(task: any): ImplementationTemplateTask {
  return {
    id: task.id,
    templateId: task.template_id,
    phase: task.phase,
    title: task.title,
    description: task.description ?? "",
    sortOrder: task.sort_order,
    dayOffset: task.day_offset ?? 0,
  };
}

function mapProject(project: any, tasks: ProjectTaskSummary[]): ImplementationProjectSummary {
  return {
    id: project.id,
    templateId: project.template_id ?? "",
    workspaceId: project.workspace_id ?? "",
    projectName: project.project_name,
    clientName: project.client_name,
    clientEmail: project.client_email,
    assignedAgent: project.assigned_agent ?? "",
    status: project.status,
    launchTargetDate: project.launch_target_date ?? "",
    tasks,
    totalTasks: tasks.length,
    doneTasks: tasks.filter((task) => task.status === "done").length,
    createdAt: project.created_at,
  };
}

function mapBrief(brief: any, projectId: string): ProjectBrief {
  return {
    id: brief?.id ?? "",
    projectId,
    appName: brief?.app_name ?? "",
    domainStrategy: brief?.domain_strategy ?? "undecided",
    desiredDomain: brief?.desired_domain ?? "",
    logoStatus: brief?.logo_status ?? "pending",
    primaryColor: brief?.primary_color ?? "",
    accentColor: brief?.accent_color ?? "",
    brandNotes: brief?.brand_notes ?? "",
    targetAudience: brief?.target_audience ?? "",
    offerSummary: brief?.offer_summary ?? "",
    pricingNotes: brief?.pricing_notes ?? "",
    paymentProvider: brief?.payment_provider ?? "",
    contentNotes: brief?.content_notes ?? "",
    exerciseVideoNotes: brief?.exercise_video_notes ?? "",
    nutritionNotes: brief?.nutrition_notes ?? "",
    legalNotes: brief?.legal_notes ?? "",
    launchNotes: brief?.launch_notes ?? "",
    internalRisks: brief?.internal_risks ?? "",
    kickoffCallAt: brief?.kickoff_call_at ?? "",
  };
}

function mapTemplateDefaults(defaults: any, templateId: string): TemplateBriefDefaults {
  return {
    templateId,
    domainStrategy: defaults?.domain_strategy ?? "undecided",
    logoStatus: defaults?.logo_status ?? "pending",
    brandNotes: defaults?.brand_notes ?? "",
    targetAudience: defaults?.target_audience ?? "",
    offerSummary: defaults?.offer_summary ?? "",
    pricingNotes: defaults?.pricing_notes ?? "",
    paymentProvider: defaults?.payment_provider ?? "",
    contentNotes: defaults?.content_notes ?? "",
    exerciseVideoNotes: defaults?.exercise_video_notes ?? "",
    nutritionNotes: defaults?.nutrition_notes ?? "",
    legalNotes: defaults?.legal_notes ?? "",
    launchNotes: defaults?.launch_notes ?? "",
    internalRisks: defaults?.internal_risks ?? "",
  };
}

function mapTemplate(template: any, tasks: ImplementationTemplateTask[], defaults: TemplateBriefDefaults): ImplementationTemplateSummary {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    description: template.description ?? "",
    buyerType: template.buyer_type ?? "",
    estimatedDays: template.estimated_days ?? 21,
    isActive: Boolean(template.is_active),
    sortOrder: template.sort_order ?? 0,
    tasks,
    defaults,
  };
}

async function loadTemplateForConversion(supabase: ReturnType<typeof createServiceSupabaseClient>, templateId?: string) {
  const templateQuery = supabase
    .from("implementation_templates")
    .select("id,name,slug,description,buyer_type,estimated_days,is_active,sort_order");

  const templateResult = templateId
    ? await templateQuery.eq("id", templateId).maybeSingle()
    : await templateQuery.eq("is_active", true).order("sort_order", { ascending: true }).limit(1).maybeSingle();

  if (templateResult.error || !templateResult.data) {
    return null;
  }

  const [tasksResult, defaultsResult] = await Promise.all([
    supabase
      .from("implementation_template_tasks")
      .select("id,template_id,phase,title,description,sort_order,day_offset")
      .eq("template_id", templateResult.data.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("implementation_template_brief_defaults")
      .select("*")
      .eq("template_id", templateResult.data.id)
      .maybeSingle(),
  ]);

  return {
    template: templateResult.data,
    tasks: (tasksResult.data ?? []).map(mapTemplateTask),
    defaults: mapTemplateDefaults(defaultsResult.data, templateResult.data.id),
  };
}

export async function listImplementationTemplates(): Promise<ImplementationTemplateSummary[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("implementation_templates")
    .select("id,name,slug,description,buyer_type,estimated_days,is_active,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Unable to load implementation templates", error.message);
    return [];
  }

  const templateIds = (data ?? []).map((template: any) => template.id);
  const [tasksResult, defaultsResult] = templateIds.length
    ? await Promise.all([
        supabase
          .from("implementation_template_tasks")
          .select("id,template_id,phase,title,description,sort_order,day_offset")
          .in("template_id", templateIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("implementation_template_brief_defaults")
          .select("*")
          .in("template_id", templateIds),
      ])
    : [{ data: [] }, { data: [] }];

  const tasksByTemplate = new Map<string, ImplementationTemplateTask[]>();
  for (const task of tasksResult.data ?? []) {
    const tasks = tasksByTemplate.get(task.template_id) ?? [];
    tasks.push(mapTemplateTask(task));
    tasksByTemplate.set(task.template_id, tasks);
  }

  const defaultsByTemplate = new Map<string, any>(
    (defaultsResult.data ?? []).map((defaults: any) => [defaults.template_id, defaults]),
  );

  return (data ?? []).map((template: any) => {
    const tasks = tasksByTemplate.get(template.id) ?? [];
    const defaults = mapTemplateDefaults(defaultsByTemplate.get(template.id), template.id);
    return mapTemplate(template, tasks, defaults);
  });
}

export async function convertLeadToProject(leadId: string, templateId?: string) {
  if (!leadId) {
    throw new Error("Falta el lead.");
  }

  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("implementation_projects")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const leadResult = await supabase
    .from("sales_leads")
    .select("id,full_name,email,brand_name,assigned_agent")
    .eq("id", leadId)
    .single();

  if (leadResult.error || !leadResult.data) {
    throw new Error("No se pudo encontrar el lead para convertirlo.");
  }

  const selectedTemplate = await loadTemplateForConversion(supabase, templateId);
  const lead = leadResult.data;
  const projectName = lead.brand_name || `App de ${lead.full_name}`;
  const projectResult = await supabase
    .from("implementation_projects")
    .insert({
      lead_id: lead.id,
      template_id: selectedTemplate?.template.id ?? null,
      project_name: projectName,
      client_name: lead.full_name,
      client_email: lead.email,
      assigned_agent: lead.assigned_agent,
      status: "discovery",
    })
    .select("id")
    .single();

  if (projectResult.error || !projectResult.data) {
    throw new Error(`No se pudo crear el proyecto: ${projectResult.error?.message ?? "error desconocido"}`);
  }

  const projectId = projectResult.data.id as string;
  const templateTasks: ImplementationTemplateTask[] = selectedTemplate?.tasks.length ? selectedTemplate.tasks : defaultOnboardingTasks.map((task) => ({
    id: "",
    templateId: "",
    phase: task.phase,
    title: task.title,
    description: task.description,
    sortOrder: task.sort_order,
    dayOffset: task.day_offset,
  }));

  const tasks = templateTasks.map((task) => ({
    project_id: projectId,
    phase: task.phase,
    title: task.title,
    description: task.description,
    sort_order: task.sortOrder,
    due_date: dateFromOffset(task.dayOffset),
  }));

  const tasksResult = await supabase
    .from("project_onboarding_tasks")
    .insert(tasks);

  if (tasksResult.error) {
    throw new Error(`No se pudo crear el checklist: ${tasksResult.error.message}`);
  }

  const defaults = selectedTemplate?.defaults;
  const briefResult = await supabase
    .from("project_briefs")
    .insert({
      project_id: projectId,
      app_name: projectName,
      domain_strategy: defaults?.domainStrategy ?? "undecided",
      logo_status: defaults?.logoStatus ?? "pending",
      brand_notes: cleanOptional(defaults?.brandNotes),
      target_audience: cleanOptional(defaults?.targetAudience),
      offer_summary: cleanOptional(defaults?.offerSummary),
      pricing_notes: cleanOptional(defaults?.pricingNotes),
      payment_provider: cleanOptional(defaults?.paymentProvider),
      content_notes: cleanOptional(defaults?.contentNotes),
      exercise_video_notes: cleanOptional(defaults?.exerciseVideoNotes),
      nutrition_notes: cleanOptional(defaults?.nutritionNotes),
      legal_notes: cleanOptional(defaults?.legalNotes),
      launch_notes: cleanOptional(defaults?.launchNotes),
      internal_risks: cleanOptional(defaults?.internalRisks),
    });

  if (briefResult.error) {
    throw new Error(`No se pudo crear el briefing inicial: ${briefResult.error.message}`);
  }

  await supabase
    .from("sales_leads")
    .update({
      status: "qualified",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  await supabase.from("lead_notes").insert({
    lead_id: leadId,
    author_name: "Sistema",
    note: selectedTemplate?.template.name
      ? `Lead convertido en proyecto con plantilla: ${selectedTemplate.template.name}.`
      : "Lead convertido en proyecto de implantación.",
  });

  return projectId;
}

export async function listImplementationProjects(): Promise<ImplementationProjectSummary[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("implementation_projects")
    .select("id,template_id,workspace_id,project_name,client_name,client_email,assigned_agent,status,launch_target_date,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Unable to load implementation projects", error.message);
    return [];
  }

  const projectIds = (data ?? []).map((project: any) => project.id);
  const tasksResult = projectIds.length
    ? await supabase
        .from("project_onboarding_tasks")
        .select("id,project_id,phase,title,description,status,sort_order,due_date,completed_at")
        .in("project_id", projectIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const tasksByProject = new Map<string, ProjectTaskSummary[]>();
  for (const task of tasksResult.data ?? []) {
    const tasks = tasksByProject.get(task.project_id) ?? [];
    tasks.push(mapTask(task));
    tasksByProject.set(task.project_id, tasks);
  }

  return (data ?? []).map((project: any) => {
    const tasks = tasksByProject.get(project.id) ?? [];
    return mapProject(project, tasks);
  });
}

export async function getImplementationProjectDetail(projectId: string): Promise<ImplementationProjectDetail | null> {
  if (!projectId) {
    return null;
  }

  const supabase = createServiceSupabaseClient();
  const projectResult = await supabase
    .from("implementation_projects")
    .select("id,template_id,workspace_id,project_name,client_name,client_email,assigned_agent,status,launch_target_date,created_at")
    .eq("id", projectId)
    .maybeSingle();

  if (projectResult.error || !projectResult.data) {
    return null;
  }

  const [tasksResult, briefResult] = await Promise.all([
    supabase
      .from("project_onboarding_tasks")
      .select("id,project_id,phase,title,description,status,sort_order,due_date,completed_at")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_briefs")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  const tasks = (tasksResult.data ?? []).map(mapTask);

  return {
    ...mapProject(projectResult.data, tasks),
    brief: mapBrief(briefResult.data, projectId),
  };
}

export async function updateProjectStatus(input: ProjectUpdateInput) {
  if (!input.id) {
    throw new Error("Falta el proyecto.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("implementation_projects")
    .update({
      status: input.status,
      assigned_agent: cleanOptional(input.assignedAgent),
      launch_target_date: cleanOptional(input.launchTargetDate),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar el proyecto: ${error.message}`);
  }
}

export async function updateProjectTask(input: ProjectTaskUpdateInput) {
  if (!input.id) {
    throw new Error("Falta la tarea.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("project_onboarding_tasks")
    .update({
      status: input.status,
      due_date: cleanOptional(input.dueDate),
      completed_at: input.status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar la tarea: ${error.message}`);
  }
}

export async function updateProjectBrief(input: ProjectBriefInput) {
  if (!input.projectId) {
    throw new Error("Falta el proyecto.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("project_briefs")
    .upsert({
      project_id: input.projectId,
      app_name: cleanOptional(input.appName),
      domain_strategy: input.domainStrategy || "undecided",
      desired_domain: cleanOptional(input.desiredDomain),
      logo_status: input.logoStatus || "pending",
      primary_color: cleanOptional(input.primaryColor),
      accent_color: cleanOptional(input.accentColor),
      brand_notes: cleanOptional(input.brandNotes),
      target_audience: cleanOptional(input.targetAudience),
      offer_summary: cleanOptional(input.offerSummary),
      pricing_notes: cleanOptional(input.pricingNotes),
      payment_provider: cleanOptional(input.paymentProvider),
      content_notes: cleanOptional(input.contentNotes),
      exercise_video_notes: cleanOptional(input.exerciseVideoNotes),
      nutrition_notes: cleanOptional(input.nutritionNotes),
      legal_notes: cleanOptional(input.legalNotes),
      launch_notes: cleanOptional(input.launchNotes),
      internal_risks: cleanOptional(input.internalRisks),
      kickoff_call_at: cleanOptional(input.kickoffCallAt),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "project_id",
    });

  if (error) {
    throw new Error(`No se pudo guardar el briefing: ${error.message}`);
  }
}

export async function createOperationalWorkspaceFromProject(projectId: string) {
  if (!projectId) {
    throw new Error("Falta el proyecto.");
  }

  const supabase = createServiceSupabaseClient();
  const projectResult = await supabase
    .from("implementation_projects")
    .select("id,workspace_id,project_name,client_name,client_email,status")
    .eq("id", projectId)
    .maybeSingle();

  if (projectResult.error || !projectResult.data) {
    throw new Error("No se pudo encontrar el proyecto.");
  }

  const briefResult = await supabase
    .from("project_briefs")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const brief = mapBrief(briefResult.data, projectId);
  const workspaceName = brief.appName || projectResult.data.project_name;
  const slugBase = slugify(workspaceName || projectResult.data.client_name);

  if (!slugBase) {
    throw new Error("El proyecto necesita un nombre válido para crear la app.");
  }

  const customDomain = normalizeDomain(brief.desiredDomain);
  const { publicDomain, memberDomain } = resolveWorkspaceDomains(customDomain);
  const accentColor = normalizeHexColor(brief.accentColor || brief.primaryColor);
  const supportEmail = projectResult.data.client_email || null;
  const workspaceSlug = `${slugBase}-${projectId.slice(0, 8)}`.slice(0, 80);
  const workspaceId = projectResult.data.workspace_id
    ? projectResult.data.workspace_id as string
    : await (async () => {
        const workspaceResult = await supabase
          .from("workspaces")
          .upsert({
            name: workspaceName,
            slug: workspaceSlug,
            app_name: workspaceName,
            custom_domain: cleanOptional(publicDomain),
            public_domain: cleanOptional(publicDomain),
            member_domain: cleanOptional(memberDomain),
            support_email: supportEmail,
            accent_color: accentColor,
            is_active: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "slug" })
          .select("id")
          .single();

        if (workspaceResult.error || !workspaceResult.data) {
          throw new Error(`No se pudo crear la app operativa: ${workspaceResult.error?.message ?? "error desconocido"}`);
        }

        return workspaceResult.data.id as string;
      })();

  await ensureOperationalWorkspaceAssets(supabase, {
    workspaceId,
    workspaceName,
    customDomain,
    accentColor,
    brief,
  });

  const projectUpdate = await supabase
    .from("implementation_projects")
    .update({
      workspace_id: workspaceId,
      status: "brand_setup",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (projectUpdate.error) {
    throw new Error(`No se pudo enlazar la app al proyecto: ${projectUpdate.error.message}`);
  }

  await recordAuditEvent(supabase, {
    workspaceId,
    action: "implementation.workspace_bootstrapped",
    entityType: "implementation_project",
    entityId: projectId,
    metadata: {
      projectName: projectResult.data.project_name,
      workspaceName,
      customDomain,
    },
  });

  return workspaceId;
}

export async function addProjectTask(input: ProjectTaskInput) {
  const title = input.title.trim();

  if (!input.projectId || !title) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  const existingTasks = await supabase
    .from("project_onboarding_tasks")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = ((existingTasks.data ?? [])[0]?.sort_order ?? 0) + 10;
  const { error } = await supabase.from("project_onboarding_tasks").insert({
    project_id: input.projectId,
    phase: input.phase.trim() || "General",
    title,
    description: cleanOptional(input.description),
    due_date: cleanOptional(input.dueDate),
    sort_order: nextSortOrder,
  });

  if (error) {
    throw new Error(`No se pudo añadir la tarea: ${error.message}`);
  }
}

export async function updateImplementationTemplate(input: ImplementationTemplateUpdateInput) {
  if (!input.id) {
    throw new Error("Falta la plantilla.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("implementation_templates")
    .update({
      name: input.name.trim(),
      description: cleanOptional(input.description),
      buyer_type: cleanOptional(input.buyerType),
      estimated_days: parseNumber(input.estimatedDays, 21),
      is_active: input.isActive === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar la plantilla: ${error.message}`);
  }
}

export async function addImplementationTemplateTask(input: ImplementationTemplateTaskInput) {
  const title = input.title.trim();

  if (!input.templateId || !title) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  const existingTasks = await supabase
    .from("implementation_template_tasks")
    .select("sort_order")
    .eq("template_id", input.templateId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = ((existingTasks.data ?? [])[0]?.sort_order ?? 0) + 10;
  const { error } = await supabase.from("implementation_template_tasks").insert({
    template_id: input.templateId,
    phase: input.phase.trim() || "General",
    title,
    description: cleanOptional(input.description),
    sort_order: nextSortOrder,
    day_offset: parseNumber(input.dayOffset, 0),
  });

  if (error) {
    throw new Error(`No se pudo añadir la tarea a la plantilla: ${error.message}`);
  }
}

export async function updateTemplateBriefDefaults(input: TemplateBriefDefaultsInput) {
  if (!input.templateId) {
    throw new Error("Falta la plantilla.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("implementation_template_brief_defaults")
    .upsert({
      template_id: input.templateId,
      domain_strategy: input.domainStrategy || "undecided",
      logo_status: input.logoStatus || "pending",
      brand_notes: cleanOptional(input.brandNotes),
      target_audience: cleanOptional(input.targetAudience),
      offer_summary: cleanOptional(input.offerSummary),
      pricing_notes: cleanOptional(input.pricingNotes),
      payment_provider: cleanOptional(input.paymentProvider),
      content_notes: cleanOptional(input.contentNotes),
      exercise_video_notes: cleanOptional(input.exerciseVideoNotes),
      nutrition_notes: cleanOptional(input.nutritionNotes),
      legal_notes: cleanOptional(input.legalNotes),
      launch_notes: cleanOptional(input.launchNotes),
      internal_risks: cleanOptional(input.internalRisks),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "template_id",
    });

  if (error) {
    throw new Error(`No se pudieron actualizar los defaults: ${error.message}`);
  }
}
