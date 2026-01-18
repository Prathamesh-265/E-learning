import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useEnrollments() {
  return useQuery({
    queryKey: [api.enrollments.list.path],
    enabled: !!localStorage.getItem("token"),
    queryFn: async () => {
      const res = await fetch(api.enrollments.list.path, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return api.enrollments.list.responses[200].parse(await res.json());
    },
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: number) => {
      const res = await fetch(api.enrollments.enroll.path, {
        method: api.enrollments.enroll.method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to enroll");
        throw new Error("Failed to enroll");
      }
      return api.enrollments.enroll.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path] }); // Refresh course details
      toast({
        title: "Enrolled!",
        description: "You can now access the course content.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Enrollment failed",
        description: err.message,
      });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      lessonId,
      completed,
    }: {
      id: number;
      lessonId: number;
      completed: boolean;
    }) => {
      const url = buildUrl(api.enrollments.updateProgress.path, { id });
      const res = await fetch(url, {
        method: api.enrollments.updateProgress.method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ lessonId, completed }),
      });

      if (!res.ok) throw new Error("Failed to update progress");
      return api.enrollments.updateProgress.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
    },
  });
}
