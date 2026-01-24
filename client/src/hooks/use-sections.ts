import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type UpdateSectionRequest = z.infer<typeof api.sections.update.input>;

export function useSections() {
  return useQuery({
    queryKey: [api.sections.list.path],
    queryFn: async () => {
      const res = await fetch(api.sections.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sections");
      return api.sections.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isDeliveryAvailable }: { id: number } & UpdateSectionRequest) => {
      const url = buildUrl(api.sections.update.path, { id });
      const res = await fetch(url, {
        method: api.sections.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeliveryAvailable }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update section");
      return api.sections.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sections.list.path] });
    },
  });
}
