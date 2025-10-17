import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TaskCard from "@/components/TaskCard";
import type { Task } from "@shared/schema";

export default function Tasks() {
  const { dbUserId } = useAuth();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', dbUserId],
    queryFn: async () => {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      const headers: Record<string, string> = {};
      if (userId) {
        headers["x-user-id"] = userId.toString();
      }
      
      const res = await fetch(`/api/tasks?userId=${dbUserId}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/tasks/${taskId}/status`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', dbUserId] });
    },
  });

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
        <h2 className="text-2xl sm:text-3xl font-bold">Assigned Tasks</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned</p>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map(task => {
            const statusMap: Record<string, "Pending" | "In Progress" | "Completed"> = {
              'pending': 'Pending',
              'in progress': 'In Progress',
              'completed': 'Completed'
            };
            const priorityMap: Record<string, "Low" | "Medium" | "High"> = {
              'low': 'Low',
              'medium': 'Medium',
              'high': 'High'
            };
            return (
              <TaskCard
                key={task.id}
                id={String(task.id)}
                userId={dbUserId!}
                title={task.title}
                description={task.description || ""}
                priority={priorityMap[task.priority.toLowerCase()] || 'Medium'}
                deadline={task.deadline ? new Date(task.deadline) : undefined}
                status={statusMap[task.status.toLowerCase()] || 'Pending'}
                assignedDate={new Date(task.createdAt)}
                onStatusChange={(status) => {
                  const dbStatus = status.toLowerCase();
                  updateTaskStatusMutation.mutate({ taskId: task.id, status: dbStatus });
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No tasks assigned yet
        </div>
      )}
    </div>
  );
}
