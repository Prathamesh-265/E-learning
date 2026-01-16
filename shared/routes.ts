
import { z } from 'zod';
import { 
  insertUserSchema, 
  createCourseSchema, 
  insertEnrollmentSchema,
  users,
  courses,
  lessons,
  enrollments
} from './schema';

// === ERROR SCHEMAS ===
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// === API CONTRACT ===
export const api = {
  auth: {
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup',
      input: insertUserSchema,
      responses: {
        201: z.custom<{ token: string; user: typeof users.$inferSelect }>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string()
      }),
      responses: {
        200: z.custom<{ token: string; user: typeof users.$inferSelect }>(),
        401: errorSchemas.unauthorized,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses',
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect & { lessons: typeof lessons.$inferSelect[] }>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/courses/:id', // Can be ID or Slug
      responses: {
        200: z.custom<typeof courses.$inferSelect & { lessons: typeof lessons.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/courses',
      input: createCourseSchema,
      responses: {
        201: z.custom<typeof courses.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/courses/:id',
      input: createCourseSchema.partial(),
      responses: {
        200: z.custom<typeof courses.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/courses/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  enrollments: {
    enroll: {
      method: 'POST' as const,
      path: '/api/enroll',
      input: z.object({ courseId: z.number() }),
      responses: {
        201: z.custom<typeof enrollments.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/enrollments/me',
      responses: {
        200: z.array(z.custom<typeof enrollments.$inferSelect & { course: typeof courses.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      }
    },
    updateProgress: {
      method: 'PUT' as const,
      path: '/api/enrollments/:id/progress',
      input: z.object({ lessonId: z.number(), completed: z.boolean() }),
      responses: {
        200: z.custom<typeof enrollments.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  admin: {
    users: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    stats: {
      method: 'GET' as const,
      path: '/api/reports',
      responses: {
        200: z.object({
          totalUsers: z.number(),
          totalCourses: z.number(),
          totalEnrollments: z.number(),
        }),
        401: errorSchemas.unauthorized,
      }
    }
  }
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
