import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import TaskCard from "./TaskCard";
import MessageCard from "./MessageCard";
import RatingBadge from "./RatingBadge";
import TimeBasedForm from "./TimeBasedForm";
import ThemeToggle from "./ThemeToggle";
import heroImage from "@assets/stock_images/professional_team_co_b1c47478.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Message, Rating } from "@shared/schema";

export default function UserDashboard() {
  const { user, signOut, dbUserId } = useAuth();
  const [, setLocation] = useLocation();
  const currentHour = new Date().getHours();
  const formType = currentHour >= 9 && currentHour < 12 ? "morning" : currentHour >= 18 && currentHour < 24 ? "evening" : null;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', dbUserId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?userId=${dbUserId}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', dbUserId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?receiverId=${dbUserId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const { data: latestRating, isLoading: ratingLoading } = useQuery<Rating | null>({
    queryKey: ['/api/ratings', dbUserId, 'latest'],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?userId=${dbUserId}&latest=true`);
      if (!res.ok) throw new Error('Failed to fetch rating');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest('PATCH', `/api/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', dbUserId] });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', dbUserId] });
    },
  });

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const markMessageAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const userName = user?.displayName || "User";
  const userEmail = user?.email || "";
  const userAvatar = user?.photoURL || "";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  const unreadCount = messages.filter(m => !m.readStatus).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">WorkLogix</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-3 pl-3 border-l">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <Avatar data-testid="avatar-user">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={heroImage}
          alt="Workspace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-primary/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-2">
              {formType === "morning" ? "Good Morning" : formType === "evening" ? "Good Evening" : "Welcome"} {userName.split(' ')[0]}!
            </h2>
            <p className="text-lg opacity-90">
              {formType === "morning"
                ? "Ready to plan your day?"
                : formType === "evening"
                ? "Time to log your progress"
                : "Let's get to work"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks and Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Time-based Form */}
            {formType && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Daily Report</h3>
                <TimeBasedForm type={formType} userName={userName.split(' ')[0]} userId={dbUserId} />
              </div>
            )}

            {/* Assigned Tasks */}
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Assigned Tasks ({tasksLoading ? "..." : tasks.length})
              </h3>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      id={String(task.id)}
                      title={task.title}
                      description={task.description || ""}
                      priority={task.priority as "Low" | "Medium" | "High"}
                      deadline={task.deadline ? new Date(task.deadline) : undefined}
                      status={task.status as "Pending" | "In Progress" | "Completed"}
                      assignedDate={new Date(task.createdAt)}
                      onStatusChange={(status) => updateTaskStatusMutation.mutate({ taskId: task.id, status })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks assigned yet
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Messages and Ratings */}
          <div className="space-y-8">
            {/* Messages */}
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Messages ({messagesLoading ? "..." : `${unreadCount} unread`})
              </h3>
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <MessageCard
                      key={msg.id}
                      id={String(msg.id)}
                      message={msg.message}
                      timestamp={new Date(msg.createdAt)}
                      isRead={msg.readStatus}
                      relatedTask={msg.relatedTaskId ? `Task #${msg.relatedTaskId}` : undefined}
                      onMarkRead={() => markMessageAsRead(msg.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No messages
                </div>
              )}
            </div>

            {/* Ratings & Feedback */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Performance Feedback</h3>
              {ratingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : latestRating ? (
                <div className="space-y-4">
                  <RatingBadge
                    rating={latestRating.rating as "Excellent" | "Good" | "Needs Improvement"}
                    feedback={latestRating.feedback || ""}
                    timestamp={new Date(latestRating.createdAt)}
                    period={latestRating.period}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No ratings yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
