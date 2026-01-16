
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT Secret - in production this should be an env var
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    (req as any).user = user;
    next();
  });
};

// Middleware to check for Admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === AUTH ROUTES ===

  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
        role: "user" // Default role
      });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      // Return without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      const { password, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === COURSES ROUTES ===

  app.get(api.courses.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const courses = await storage.getCourses({ category, search });
    res.json(courses);
  });

  app.get(api.courses.get.path, async (req, res) => {
    const idOrSlug = req.params.id;
    let course;
    if (!isNaN(Number(idOrSlug))) {
       course = await storage.getCourse(Number(idOrSlug));
    } else {
       course = await storage.getCourseBySlug(idOrSlug);
    }

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  });

  app.post(api.courses.create.path, authenticateToken, isAdmin, async (req, res) => {
    try {
      const input = api.courses.create.input.parse(req.body);
      const { lessons, ...courseData } = input;
      const course = await storage.createCourse(courseData, lessons);
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // === ENROLLMENT ROUTES ===

  app.post(api.enrollments.enroll.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const { courseId } = req.body;
    
    // Check if already enrolled
    const existing = await storage.getEnrollment(userId, courseId);
    if (existing) return res.status(400).json({ message: "Already enrolled" });

    const enrollment = await storage.createEnrollment(userId, courseId);
    res.status(201).json(enrollment);
  });

  app.get(api.enrollments.list.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const enrollments = await storage.getUserEnrollments(userId);
    res.json(enrollments);
  });

  app.put(api.enrollments.updateProgress.path, authenticateToken, async (req, res) => {
    const enrollmentId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { lessonId, completed } = req.body;

    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (enrollment.userId !== userId) return res.status(403).json({ message: "Not authorized" });

    const newProgress = { ...enrollment.progress, [lessonId]: completed };
    const updated = await storage.updateEnrollmentProgress(enrollmentId, newProgress);
    res.json(updated);
  });

  // === ADMIN ROUTES ===

  app.get(api.admin.users.path, authenticateToken, isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get(api.admin.stats.path, authenticateToken, isAdmin, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Seed Data if needed
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const usersList = await storage.getAllUsers();
  if (usersList.length === 0) {
    // Create Admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin"
    });

    // Create Demo Courses
    await storage.createCourse({
      title: "Full Stack React & Node",
      slug: "full-stack-react-node",
      description: "Learn to build modern web applications from scratch.",
      price: "49.99",
      category: "Development",
      difficulty: "Intermediate",
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80"
    }, [
      { title: "Introduction", contentHtml: "<p>Welcome to the course!</p>", order: 1 },
      { title: "Setup", contentHtml: "<p>Let's install Node.js</p>", order: 2 }
    ]);

    await storage.createCourse({
      title: "Advanced TypeScript Patterns",
      slug: "advanced-typescript",
      description: "Master generic types, utility types, and advanced architectural patterns.",
      price: "79.99",
      category: "Development",
      difficulty: "Advanced",
      thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80"
    }, [
      { title: "Generics Deep Dive", contentHtml: "<p>Understanding generic constraints and defaults.</p>", order: 1 },
      { title: "Conditional Types", contentHtml: "<p>Creating dynamic types based on inputs.</p>", order: 2 }
    ]);

    await storage.createCourse({
      title: "UI/UX Design Fundamentals",
      slug: "ui-ux-fundamentals",
      description: "The essential guide to modern interface design and user experience.",
      price: "39.99",
      category: "Design",
      difficulty: "Beginner",
      thumbnailUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800&q=80"
    }, [
      { title: "Visual Hierarchy", contentHtml: "<p>Guiding the user's eye with color and spacing.</p>", order: 1 },
      { title: "Typography", contentHtml: "<p>Choosing and pairing fonts effectively.</p>", order: 2 }
    ]);

    await storage.createCourse({
      title: "Mastering Tailwind CSS",
      slug: "mastering-tailwind",
      description: "Build beautiful, responsive layouts at lightning speed with Tailwind.",
      price: "29.99",
      category: "Design",
      difficulty: "Intermediate",
      thumbnailUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80"
    }, [
      { title: "Utility First Concept", contentHtml: "<p>Why utility classes beat traditional CSS.</p>", order: 1 },
      { title: "Responsive Design", contentHtml: "<p>Building layouts for every screen size.</p>", order: 2 }
    ]);
  }
}
