import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppSidebar from "./AppSidebar";
import MetricCard from "./MetricCard";
import ThemeToggle from "./ThemeToggle";
import { Users, FileText, CheckCircle, FolderOpen, Plus, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Report } from "@shared/schema";

export default function AdminDashboard() {
  const { user, signOut, dbUserId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    deadline: "",
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    totalFiles: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof taskForm) => {
      const payload = {
        assignedBy: dbUserId,
        assignedTo: parseInt(taskData.assignedTo),
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString() : null,
        status: "pending",
      };
      return await apiRequest('POST', '/api/tasks', payload);
    },
    onSuccess: () => {
      toast({
        title: "Task created successfully",
        description: "The task has been assigned to the user.",
      });
      setTaskDialogOpen(false);
      setTaskForm({ title: "", description: "", assignedTo: "", priority: "medium", deadline: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!taskForm.title || !taskForm.assignedTo) {
      toast({
        title: "Missing required fields",
        description: "Please fill in task title and assign to a user.",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate(taskForm);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const getUserNameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || "Unknown User";
  };

  const filteredReports = reports.filter(report => {
    const userName = getUserNameById(report.userId);
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const adminName = user?.displayName || "Admin";
  const adminAvatar = user?.photoURL || "";
  const adminInitials = adminName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-card border-b border-card-border shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-3 pl-3 border-l">
                  <Avatar data-testid="avatar-admin">
                    <AvatarImage src={adminAvatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {adminInitials}
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
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 space-y-8">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="Total Users" 
                value={stats?.totalUsers?.toString() || "0"} 
                icon={Users} 
                trend="" 
              />
              <MetricCard 
                title="Today's Reports" 
                value={stats?.todayReports?.toString() || "0"} 
                icon={FileText} 
                trend="" 
              />
              <MetricCard 
                title="Pending Tasks" 
                value={stats?.pendingTasks?.toString() || "0"} 
                icon={CheckCircle} 
                trend="" 
              />
              <MetricCard 
                title="Uploaded Files" 
                value={stats?.totalFiles?.toString() || "0"} 
                icon={FolderOpen} 
                trend="" 
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover-elevate active-elevate-2" data-testid="card-create-task">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Create New Task</h3>
                        <p className="text-sm text-muted-foreground">Assign tasks to users</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Assign a new task to one or more users
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Task Title *</Label>
                      <Input
                        id="task-title"
                        placeholder="Enter task title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        data-testid="input-task-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        placeholder="Enter task description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        data-testid="input-task-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="assign-to">Assign To *</Label>
                        <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}>
                          <SelectTrigger data-testid="select-assign-to">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.role === 'user').map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>{user.displayName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                        data-testid="input-deadline"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateTask} 
                      className="w-full" 
                      data-testid="button-create-task"
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Card 
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => document.querySelector('#reports-section')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="card-view-reports"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View All Reports</h3>
                    <p className="text-sm text-muted-foreground">Access submitted reports</p>
                  </div>
                </CardContent>
              </Card>

              <a href="#users" className="block">
                <Card className="cursor-pointer hover-elevate active-elevate-2" data-testid="card-manage-users">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Manage Users</h3>
                      <p className="text-sm text-muted-foreground">View and rate users</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>

            {/* Recent Reports Table */}
            <Card id="reports-section">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle>Recent Reports</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by user..."
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-reports"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredReports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold">User</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Tasks</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report, index) => (
                          <tr
                            key={report.id}
                            className={`border-b ${index % 2 === 0 ? "bg-card" : "bg-muted/20"} hover-elevate`}
                            data-testid={`row-report-${report.id}`}
                          >
                            <td className="py-3 px-4 text-sm">{getUserNameById(report.userId)}</td>
                            <td className="py-3 px-4 text-sm capitalize">{report.reportType}</td>
                            <td className="py-3 px-4 text-sm font-mono text-xs">{format(new Date(report.createdAt), "MMM dd, yyyy")}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs">
                              {report.plannedTasks || report.completedTasks || "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm" data-testid={`button-view-report-${report.id}`}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports found
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
