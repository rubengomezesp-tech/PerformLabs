import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type SalesLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  brandName?: string;
  websiteUrl?: string;
  monthlyClients?: string;
  mainGoal?: string;
  notes?: string;
};

export type SalesLeadSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  brandName: string;
  monthlyClients: string;
  mainGoal: string;
  notes: string;
  status: string;
  priority: string;
  assignedAgent: string;
  nextActionAt: string;
  noteCount: number;
  latestNote: string;
  projectId: string;
  createdAt: string;
};

export type LeadUpdateInput = {
  id: string;
  status: string;
  priority: string;
  assignedAgent: string;
  nextActionAt: string;
  qualificationNotes: string;
};

export type LeadNoteInput = {
  leadId: string;
  authorName: string;
  note: string;
};

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

export async function createSalesLead(input: SalesLeadInput) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Introduce un email válido.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("sales_leads").insert({
    full_name: fullName,
    email,
    phone: cleanOptional(input.phone),
    brand_name: cleanOptional(input.brandName),
    website_url: cleanOptional(input.websiteUrl),
    monthly_clients: cleanOptional(input.monthlyClients),
    main_goal: cleanOptional(input.mainGoal),
    notes: cleanOptional(input.notes),
    source: "landing",
    status: "new",
  });

  if (error) {
    throw new Error(`No se pudo registrar la consulta: ${error.message}`);
  }
}

export async function listSalesLeads(): Promise<SalesLeadSummary[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("sales_leads")
    .select("id,full_name,email,phone,brand_name,monthly_clients,main_goal,notes,status,priority,assigned_agent,next_action_at,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Unable to load sales leads", error.message);
    return [];
  }

  const leadIds = data.map((lead: any) => lead.id);
  const [notesResult, projectsResult] = leadIds.length
    ? await Promise.all([
        supabase
          .from("lead_notes")
          .select("lead_id,note,created_at")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("implementation_projects")
          .select("id,lead_id")
          .in("lead_id", leadIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  const notesByLead = new Map<string, { count: number; latest: string }>();
  for (const note of notesResult.data ?? []) {
    const current = notesByLead.get(note.lead_id) ?? { count: 0, latest: "" };
    notesByLead.set(note.lead_id, {
      count: current.count + 1,
      latest: current.latest || note.note,
    });
  }

  const projectsByLead = new Map<string, string>(
    (projectsResult.data ?? []).map((project: any) => [project.lead_id, project.id]),
  );

  return data.map((lead: any) => ({
    id: lead.id,
    fullName: lead.full_name,
    email: lead.email,
    phone: lead.phone ?? "",
    brandName: lead.brand_name ?? "",
    monthlyClients: lead.monthly_clients ?? "",
    mainGoal: lead.main_goal ?? "",
    notes: lead.notes ?? "",
    status: lead.status,
    priority: lead.priority ?? "normal",
    assignedAgent: lead.assigned_agent ?? "",
    nextActionAt: lead.next_action_at ?? "",
    noteCount: notesByLead.get(lead.id)?.count ?? 0,
    latestNote: notesByLead.get(lead.id)?.latest ?? "",
    projectId: projectsByLead.get(lead.id) ?? "",
    createdAt: lead.created_at,
  }));
}

export async function updateSalesLead(input: LeadUpdateInput) {
  if (!input.id) {
    throw new Error("Falta el lead.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("sales_leads")
    .update({
      status: input.status,
      priority: input.priority,
      assigned_agent: cleanOptional(input.assignedAgent),
      next_action_at: cleanOptional(input.nextActionAt),
      qualification_notes: cleanOptional(input.qualificationNotes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar el lead: ${error.message}`);
  }
}

export async function addLeadNote(input: LeadNoteInput) {
  const note = input.note.trim();

  if (!input.leadId || !note) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("lead_notes").insert({
    lead_id: input.leadId,
    author_name: input.authorName.trim() || "Equipo",
    note,
  });

  if (error) {
    throw new Error(`No se pudo guardar la nota: ${error.message}`);
  }
}
