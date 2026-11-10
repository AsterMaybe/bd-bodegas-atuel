import { z } from "zod";

export const wineBatchSchema = z.object({
  wineName: z.string().min(1, "El nombre del vino es requerido"),
  batchId: z.string().optional(),
  vintage: z.string().min(1, "La añada es requerida"),
  grapeVariety: z.string().min(1, "La variedad de uva es requerida"),
  vineyard: z.string().min(1, "El viñedo es requerido"),
  estateZone: z.string().optional(),
  volume: z.string().min(1, "El volumen es requerido").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Volumen inválido"),
  cellarLocation: z.string().min(1, "La ubicación en bodega es requerida"),
  status: z.string().min(1, "El estado es requerido"),
  winemaker: z.string().optional(),
  tastingNotes: z.string().optional(),
});

export function validateWineBatch(data) {
  return wineBatchSchema.safeParse(data);
}

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
