import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";

type InboxResp =
  | { _id: string; read: boolean }[]
  | { notifications: { _id: string; read: boolean }[] }
  | { data: { _id: string; read: boolean }[] };

function countUnread(raw: InboxResp): number {
  let items: { read: boolean }[];
  if (Array.isArray(raw)) {
    items = raw;
  } else if ("notifications" in raw && Array.isArray((raw as any).notifications)) {
    items = (raw as any).notifications;
  } else if ("data" in raw && Array.isArray((raw as any).data)) {
    items = (raw as any).data;
  } else {
    items = [];
  }
  return items.filter((n) => !n.read).length;
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);
  const clientUser = useAuthStore((s) => s.clientUser);
  const isAuthenticated = !!(user || clientUser);

  const { data } = useQuery<InboxResp>({
    queryKey: ["notifications"],
    queryFn: () => api.get<InboxResp>(API.notifications.inbox),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  return data ? countUnread(data) : 0;
}
