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
import { useWebSocket } from "@/hooks/use-websocket";
import { useCallback } from "react";
import type { Task, Message, Rating, GroupMessage } from "@shared/schema";

export default function UserDashboard() {
  const { user, signOut, dbUserId } = useAuth();
  const [, setLocation] = useLocation();
  const currentHour = new Date().getHours();
  const formType = currentHour >= 9 && currentHour < 12 ? "morning" : currentHour >= 18 && currentHour < 24 ? "evening" : null;

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'USER_DELETED' && data.userId === dbUserId) {
      signOut();
      setLocation("/");
    }
  }, [dbUserId, signOut, setLocation]);

  useWebSocket(handleWebSocketMessage);

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

  const { data: allRatings = [] } = useQuery<Rating[]>({
    queryKey: ['/api/ratings', dbUserId, 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?userId=${dbUserId}`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      return res.json();
    },
    enabled: !!dbUserId,
  });

  const { data: groupMessages = [] } = useQuery<GroupMessage[]>({
    queryKey: ['/api/group-messages'],
    queryFn: async () => {
      const res = await fetch('/api/group-messages?limit=10');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', dbUserId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      await queryClient.refetchQueries({ queryKey: ['/api/dashboard/stats'] });
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
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-sm font-medium" data-testid="text-ratings-count">
                  ⭐ {allRatings.length} {allRatings.length === 1 ? 'Rating' : 'Ratings'} Received
                </span>
              </div>
              {latestRating && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full" data-testid="badge-latest-rating">
                  <span className="text-sm font-medium">
                    Latest: {latestRating.rating}
                  </span>
                </div>
              )}
            </div>
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

            {/* Announcements */}
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Announcements ({groupMessages.length})
              </h3>
              {groupMessages.length > 0 ? (
                <div className="space-y-3">
                  {groupMessages.map(announcement => (
                    <div 
                      key={announcement.id} 
                      className="bg-card border rounded-lg p-4 hover-elevate"
                      data-testid={`announcement-${announcement.id}`}
                    >
                      {announcement.title && (
                        <h4 className="font-semibold text-primary mb-2">{announcement.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground mb-3">
                        {announcement.message}
                      </p>
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No announcements
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
