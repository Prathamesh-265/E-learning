import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Course, type InsertCourse, createCourseSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all courses with optional filters
export function useCourses(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: [api.courses.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.courses.list.path, window.location.origin);
      if (filters?.category) url.searchParams.set("category", filters.category);
      if (filters?.search) url.searchParams.set("search", filters.search);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return api.courses.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single course by ID or Slug
export function useCourse(idOrSlug: string | number) {
  return useQuery({
    queryKey: [api.courses.get.path, idOrSlug],
    queryFn: async () => {
      const url = buildUrl(api.courses.get.path, { id: idOrSlug });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Course not found");
      if (!res.ok) throw new Error("Failed to fetch course");
      return api.courses.get.responses[200].parse(await res.json());
    },
    enabled: !!idOrSlug,
  });
}

// Create course (Admin)
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const validated = createCourseSchema.parse(data);
      const res = await fetch(api.courses.create.path, {
        method: api.courses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create course");
      return api.courses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Success", description: "Course created successfully" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}

// Delete course (Admin)
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.courses.delete.path, { id });
      const res = await fetch(url, { 
        method: api.courses.delete.method, 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete course");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Success", description: "Course deleted" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}
