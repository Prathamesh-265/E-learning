
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses Table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty", { enum: ["Beginner", "Intermediate", "Advanced"] }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lessons Table (One-to-many relation with Courses)
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(), // Foreign key ref added in relations
  title: text("title").notNull(),
  contentHtml: text("content_html").notNull(),
  videoUrl: text("video_url"),
  order: integer("order").notNull(),
});

// Enrollments Table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  // Storing progress as JSONB: { [lessonId: string]: boolean }
  progress: jsonb("progress").$type<Record<string, boolean>>().default({}),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  enrollments: many(enrollments),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, role: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
// Helper to insert a course WITH lessons
export const createCourseSchema = insertCourseSchema.extend({
  lessons: z.array(insertLessonSchema.omit({ courseId: true })),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, progress: true });

// === EXPLICIT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;

// For API responses where we include relation data
export type CourseWithLessons = Course & { lessons: Lesson[] };
export type EnrollmentWithDetails = Enrollment & { course: Course };

// Auth types
export type LoginRequest = { email: string; password: string };
export type AuthResponse = { token: string; user: Omit<User, 'password'> };
