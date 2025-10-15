import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/MetricCard";
import { Users, FileText, CheckCircle, FolderOpen, Plus, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    completedTasks: number;
    totalFiles: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const quickActions = [
    { icon: Plus, label: "Create Task", onClick: () => setLocation("/admin/tasks") },
    { icon: MessageSquare, label: "Send Message", onClick: () => setLocation("/admin/messages") },
    { icon: FileText, label: "View Reports", onClick: () => setLocation("/admin/reports") },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Monitor your team's performance and activity
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend="+12%"
          data-testid="metric-total-users"
        />
        <MetricCard
          title="Today's Reports"
          value={stats?.todayReports || 0}
          icon={FileText}
          trend="+8%"
          data-testid="metric-today-reports"
        />
        <MetricCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          icon={FolderOpen}
          trend="-3%"
          data-testid="metric-pending-tasks"
        />
        <MetricCard
          title="Completed Tasks"
          value={stats?.completedTasks || 0}
          icon={CheckCircle}
          trend="+15%"
          data-testid="metric-completed-tasks"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start gap-3 h-auto py-3 sm:py-4"
                onClick={action.onClick}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm sm:text-base">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
