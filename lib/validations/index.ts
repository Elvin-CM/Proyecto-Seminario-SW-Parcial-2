import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export const OrderDeliveryStatusSchema = z.object({
  orderId: z.string().min(1),
  deliveryStatus: z.enum(["PACKAGING", "SHIPPED"]),
});

export const OrderReceivedSchema = z.object({
  orderId: z.string().min(1),
});
