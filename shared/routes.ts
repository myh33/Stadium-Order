import { z } from 'zod';
import { insertProductSchema, insertSectionSchema, products, sections, orders } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  sections: {
    list: {
      method: 'GET' as const,
      path: '/api/sections',
      responses: {
        200: z.array(z.custom<typeof sections.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/sections/:id',
      input: z.object({ isDeliveryAvailable: z.boolean() }),
      responses: {
        200: z.custom<typeof sections.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: z.object({
        items: z.array(z.object({ productId: z.number(), quantity: z.number() })),
        type: z.enum(['pickup', 'delivery']),
        sectionId: z.number().optional(),
        row: z.string().optional(),
        seat: z.string().optional(),
        guestName: z.string().optional(),
      }),
      responses: {
        201: z.custom<any>(), // Returns OrderWithDetails, effectively
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      input: z.object({
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status',
      input: z.object({
        status: z.enum(['pending', 'preparing', 'ready', 'delivering', 'completed', 'cancelled']),
      }),
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
