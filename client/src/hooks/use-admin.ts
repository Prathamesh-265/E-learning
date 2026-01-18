import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.users.path],
    enabled: !!localStorage.getItem("token"),
    queryFn: async () => {
      const res = await fetch(api.admin.users.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.admin.users.responses[200].parse(await res.json());
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    enabled: !!localStorage.getItem("token"),
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.admin.stats.responses[200].parse(await res.json());
    },
  });
}
