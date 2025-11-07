import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_transit',
  'delivered',
  'failed',
  'cancelled',
  'returned',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderPrioritySchema = z.enum(['normal', 'high', 'urgent']);

export type OrderPriority = z.infer<typeof OrderPrioritySchema>;

export const AddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string().length(2),
  zipcode: z.string(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

export type Address = z.infer<typeof AddressSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  sku: z.string().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  customer: CustomerSchema,
  address: AddressSchema,
  items: z.array(OrderItemSchema),
  status: OrderStatusSchema,
  priority: OrderPrioritySchema,
  totalValue: z.number().positive(),
  deliveryWindow: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;

export const DailySummarySchema = z.object({
  date: z.string().datetime(),
  driverId: z.string(),
  driverName: z.string(),
  totalOrders: z.number().int().nonnegative(),
  completedOrders: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
  urgentOrders: z.number().int().nonnegative(),
  orders: z.array(OrderSchema),
});

export type DailySummary = z.infer<typeof DailySummarySchema>;

export const OrderConfirmationSchema = z.object({
  orderId: z.string(),
  status: OrderStatusSchema,
  timestamp: z.string().datetime(),
  notes: z.string().optional(),
  photo: z.string().optional(), // Base64 encoded image
});

export type OrderConfirmation = z.infer<typeof OrderConfirmationSchema>;

export const WhatsAppMessageSchema = z.object({
  key: z.object({
    remoteJid: z.string(),
    fromMe: z.boolean(),
    id: z.string(),
  }),
  message: z.object({
    conversation: z.string().optional(),
    extendedTextMessage: z
      .object({
        text: z.string(),
      })
      .optional(),
  }),
  messageTimestamp: z.number(),
  pushName: z.string().optional(),
});

export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;

export const AIQuerySchema = z.object({
  driverId: z.string(),
  message: z.string().min(1),
  context: z
    .object({
      conversationId: z.string().optional(),
      previousMessages: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AIQuery = z.infer<typeof AIQuerySchema>;

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
  timestamp: z.string().datetime(),
});

export type ApiResponse<T = unknown> = Omit<z.infer<typeof ApiResponseSchema>, 'data'> & {
  data?: T;
};

export const HealthCheckSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  environment: z.string(),
  version: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    statusCode: z.number(),
    details: z.unknown().optional(),
  }),
  timestamp: z.string().datetime(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
