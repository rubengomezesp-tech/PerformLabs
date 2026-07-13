import { z } from "zod";

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export const publicCoachContactSchema = z.object({
  slug: z.string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Marca no válida."),
  kind: z.enum(["contact", "coaching"]),
  fullName: z.string()
    .trim()
    .min(2)
    .max(80)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "Nombre no válido."),
  email: z.string().trim().toLowerCase().email().max(160),
  message: z.string().trim().max(2_000).default(""),
  website: z.string().trim().max(200).default(""),
  submissionId: z.string().uuid(),
}).strict();

export type PublicCoachContact = z.infer<typeof publicCoachContactSchema>;
