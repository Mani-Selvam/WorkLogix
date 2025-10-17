import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import MessageCard from "@/components/MessageCard";
import type { Message } from "@shared/schema";

export default function Messages() {
  const { dbUserId } = useAuth();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', dbUserId],
    queryFn: async () => {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      const headers: Record<string, string> = {};
      if (userId) {
        headers["x-user-id"] = userId.toString();
      }
      
      const res = await fetch(`/api/messages?receiverId=${dbUserId}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      const headers: Record<string, string> = {};
      if (userId) {
        headers["x-user-id"] = userId.toString();
      }
      
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark message as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', dbUserId] });
    },
  });

  const unreadCount = messages.filter(m => !m.readStatus).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Messages</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map(msg => (
            <MessageCard
              key={msg.id}
              id={String(msg.id)}
              message={msg.message}
              timestamp={new Date(msg.createdAt)}
              isRead={msg.readStatus}
              relatedTask={msg.relatedTaskId ? `Task #${msg.relatedTaskId}` : undefined}
              onMarkRead={() => markAsReadMutation.mutate(msg.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No messages yet
        </div>
      )}
    </div>
  );
}
