import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/MetricCard";
import { Users, FileText, CheckCircle, FolderOpen, Plus, MessageSquare, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyData {
  id: number;
  name: string;
  maxAdmins: number;
  maxMembers: number;
  currentAdmins: number;
  currentMembers: number;
  isActive: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { dbUserId, companyId } = useAuth();

  const { data: stats } = useQuery<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    completedTasks: number;
    totalFiles: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: company } = useQuery<CompanyData>({
    queryKey: ['/api/my-company'],
    enabled: !!companyId && !!dbUserId,
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

      {/* Company Info Banner */}
      {company && (
        <Card data-testid="card-company-banner">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" data-testid="text-dashboard-company-name">
                  {company.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Admins: </span>
                    <span className="font-medium" data-testid="text-dashboard-admin-count">
                      {company.currentAdmins}/{company.maxAdmins}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Members: </span>
                    <span className="font-medium" data-testid="text-dashboard-member-count">
                      {company.currentMembers}/{company.maxMembers}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Capacity: </span>
                    <span className="font-medium" data-testid="text-dashboard-total-capacity">
                      {company.currentAdmins + company.currentMembers}/{company.maxAdmins + company.maxMembers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
