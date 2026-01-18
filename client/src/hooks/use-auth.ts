import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  insertUserSchema,
  type User,
  type InsertUser,
  type LoginRequest,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: [api.auth.me.path],
    enabled: !!localStorage.getItem("token"), // ✅ ADDED (prevents 401 when not logged in)
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password");
        throw new Error("Login failed");
      }

      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);

      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      setLocation(data.user.role === "admin" ? "/admin" : "/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const validated = insertUserSchema.parse(data);

      const res = await fetch(api.auth.signup.path, {
        method: api.auth.signup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }

      return api.auth.signup.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);

      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({
        title: "Account created!",
        description: "Welcome to EduPlatform",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("token");
      queryClient.setQueryData([api.auth.me.path], null);
    },
    onSuccess: () => {
      setLocation("/login");
      toast({ title: "Logged out" });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
