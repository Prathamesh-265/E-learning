
import { db } from "./db";
import { 
  users, courses, lessons, enrollments,
  type User, type Course, type Lesson, type Enrollment,
  type CourseWithLessons, type EnrollmentWithDetails
} from "@shared/schema";
import { eq, like, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Course operations
  getCourses(filters?: { category?: string; search?: string }): Promise<CourseWithLessons[]>;
  getCourse(id: number): Promise<CourseWithLessons | undefined>;
  getCourseBySlug(slug: string): Promise<CourseWithLessons | undefined>;
  createCourse(course: Omit<Course, "id" | "createdAt">, lessons: Omit<Lesson, "id" | "courseId">[]): Promise<CourseWithLessons>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course>; // Simplified update
  deleteCourse(id: number): Promise<void>;

  // Enrollment operations
  createEnrollment(userId: number, courseId: number): Promise<Enrollment>;
  getUserEnrollments(userId: number): Promise<EnrollmentWithDetails[]>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  getEnrollmentById(id: number): Promise<Enrollment | undefined>;
  updateEnrollmentProgress(id: number, progress: Record<string, boolean>): Promise<Enrollment>;

  // Admin stats
  getStats(): Promise<{ totalUsers: number; totalCourses: number; totalEnrollments: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getCourses(filters?: { category?: string; search?: string }): Promise<CourseWithLessons[]> {
    let query = db.select().from(courses);
    
    // Note: This is a basic implementation. For production search, use full-text search.
    // Drizzle query builder allows dynamic where clauses
    const conditions = [];
    if (filters?.category) conditions.push(eq(courses.category, filters.category));
    if (filters?.search) conditions.push(like(courses.title, `%${filters.search}%`));
    
    const result = conditions.length > 0 
      ? await db.select().from(courses).where(and(...conditions))
      : await db.select().from(courses);

    // Fetch lessons for each course (could be optimized with a join, but this is simple)
    const coursesWithLessons = await Promise.all(result.map(async (course) => {
      const courseLessons = await db.select().from(lessons)
        .where(eq(lessons.courseId, course.id))
        .orderBy(lessons.order);
      return { ...course, lessons: courseLessons };
    }));

    return coursesWithLessons;
  }

  async getCourse(id: number): Promise<CourseWithLessons | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return undefined;

    const courseLessons = await db.select().from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(lessons.order);
    
    return { ...course, lessons: courseLessons };
  }

  async getCourseBySlug(slug: string): Promise<CourseWithLessons | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return undefined;

    const courseLessons = await db.select().from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(lessons.order);
    
    return { ...course, lessons: courseLessons };
  }

  async createCourse(courseData: Omit<Course, "id" | "createdAt">, lessonData: Omit<Lesson, "id" | "courseId">[]): Promise<CourseWithLessons> {
    return await db.transaction(async (tx) => {
      const [newCourse] = await tx.insert(courses).values(courseData).returning();
      
      const newLessons = [];
      for (const lesson of lessonData) {
        const [newLesson] = await tx.insert(lessons).values({
          ...lesson,
          courseId: newCourse.id,
        }).returning();
        newLessons.push(newLesson);
      }

      return { ...newCourse, lessons: newLessons };
    });
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const [updated] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(lessons).where(eq(lessons.courseId, id));
      await tx.delete(enrollments).where(eq(enrollments.courseId, id));
      await tx.delete(courses).where(eq(courses.id, id));
    });
  }

  async createEnrollment(userId: number, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({
      userId,
      courseId,
      progress: {}
    }).returning();
    return enrollment;
  }

  async getUserEnrollments(userId: number): Promise<EnrollmentWithDetails[]> {
    const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    
    // Enrich with course data
    const results = await Promise.all(userEnrollments.map(async (enrollment) => {
      const [course] = await db.select().from(courses).where(eq(courses.id, enrollment.courseId));
      return { ...enrollment, course };
    }));
    
    return results as EnrollmentWithDetails[];
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async getEnrollmentById(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async updateEnrollmentProgress(id: number, progress: Record<string, boolean>): Promise<Enrollment> {
    const [updated] = await db.update(enrollments)
      .set({ progress })
      .where(eq(enrollments.id, id))
      .returning();
    return updated;
  }

  async getStats(): Promise<{ totalUsers: number; totalCourses: number; totalEnrollments: number }> {
    const usersCount = await db.select({ count: users.id }).from(users);
    const coursesCount = await db.select({ count: courses.id }).from(courses);
    const enrollmentsCount = await db.select({ count: enrollments.id }).from(enrollments);
    
    return {
      totalUsers: usersCount.length,
      totalCourses: coursesCount.length,
      totalEnrollments: enrollmentsCount.length,
    };
  }
}

export const storage = new DatabaseStorage();
