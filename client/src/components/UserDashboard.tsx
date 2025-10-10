import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import TaskCard from "./TaskCard";
import MessageCard from "./MessageCard";
import RatingBadge from "./RatingBadge";
import TimeBasedForm from "./TimeBasedForm";
import ThemeToggle from "./ThemeToggle";
import heroImage from "@assets/stock_images/professional_team_co_b1c47478.jpg";
import { useState } from "react";

// TODO: Remove mock data when implementing real authentication
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@company.com",
  avatar: "",
  initials: "SJ",
};

// TODO: Remove mock data when implementing real data fetching
const mockTasks = [
  {
    id: "1",
    title: "Complete Q4 Sales Report",
    description: "Prepare comprehensive sales analysis for Q4 including regional breakdowns, customer segments, and revenue projections.",
    priority: "High" as const,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "In Progress" as const,
    assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Update Customer Database",
    description: "Review and update all customer contact information in the CRM system.",
    priority: "Medium" as const,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "Pending" as const,
    assignedDate: new Date(),
  },
];

const mockMessages = [
  {
    id: "1",
    message: "New task assigned: Complete Q4 Sales Report. Please review the requirements.",
    timestamp: new Date(),
    isRead: false,
    relatedTask: "Q4 Sales Report",
  },
  {
    id: "2",
    message: "Great work on the marketing analysis! Keep it up.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
  },
];

const mockRatings = [
  {
    rating: "Excellent" as const,
    feedback: "Outstanding performance this month! Your reports are always thorough and submitted on time.",
    timestamp: new Date(),
    period: "November 2024",
  },
];

export default function UserDashboard() {
  const [messages, setMessages] = useState(mockMessages);
  const currentHour = new Date().getHours();
  const formType = currentHour >= 9 && currentHour < 12 ? "morning" : currentHour >= 18 && currentHour < 24 ? "evening" : null;

  const handleLogout = () => {
    console.log("Logout triggered");
    // TODO: Implement Firebase logout
  };

  const markMessageAsRead = (id: string) => {
    setMessages(messages.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
  };

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
                  <p className="text-sm font-medium">{mockUser.name}</p>
                  <p className="text-xs text-muted-foreground">{mockUser.email}</p>
                </div>
                <Avatar data-testid="avatar-user">
                  <AvatarImage src={mockUser.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {mockUser.initials}
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
              {formType === "morning" ? "Good Morning" : formType === "evening" ? "Good Evening" : "Welcome"} {mockUser.name.split(' ')[0]}!
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
                <TimeBasedForm type={formType} userName={mockUser.name.split(' ')[0]} />
              </div>
            )}

            {/* Assigned Tasks */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Assigned Tasks ({mockTasks.length})</h3>
              <div className="space-y-4">
                {mockTasks.map(task => (
                  <TaskCard key={task.id} {...task} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Messages and Ratings */}
          <div className="space-y-8">
            {/* Messages */}
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Messages ({messages.filter(m => !m.isRead).length} unread)
              </h3>
              <div className="space-y-3">
                {messages.map(msg => (
                  <MessageCard
                    key={msg.id}
                    {...msg}
                    onMarkRead={() => markMessageAsRead(msg.id)}
                  />
                ))}
              </div>
            </div>

            {/* Ratings & Feedback */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Performance Feedback</h3>
              <div className="space-y-4">
                {mockRatings.map((rating, idx) => (
                  <RatingBadge key={idx} {...rating} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
