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

// TODO: Remove mock data when implementing real data fetching
const mockReports = [
  { id: "1", user: "Sarah Johnson", type: "Morning", date: new Date(), status: "Submitted" },
  { id: "2", user: "John Smith", type: "Evening", date: new Date(Date.now() - 24 * 60 * 60 * 1000), status: "Submitted" },
  { id: "3", user: "Emma Davis", type: "Morning", date: new Date(), status: "Pending" },
];

const mockUsers = [
  { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com" },
  { id: "2", name: "John Smith", email: "john.s@company.com" },
  { id: "3", name: "Emma Davis", email: "emma.d@company.com" },
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "",
  });

  const handleCreateTask = () => {
    console.log("Task created:", taskForm);
    setTaskDialogOpen(false);
    setTaskForm({ title: "", description: "", assignedTo: "", priority: "Medium", deadline: "" });
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

  const filteredReports = mockReports.filter(report =>
    report.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <MetricCard title="Total Users" value="24" icon={Users} trend="+3 this month" />
              <MetricCard title="Today's Reports" value="18" icon={FileText} trend="75% submitted" />
              <MetricCard title="Pending Tasks" value="12" icon={CheckCircle} trend="3 due today" />
              <MetricCard title="Uploaded Files" value="156" icon={FolderOpen} trend="+8 today" />
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
                            {mockUsers.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
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
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
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
                    <Button onClick={handleCreateTask} className="w-full" data-testid="button-create-task">
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Card className="cursor-pointer hover-elevate active-elevate-2">
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

              <Card className="cursor-pointer hover-elevate active-elevate-2">
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
            </div>

            {/* Recent Reports Table */}
            <Card>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
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
                          <td className="py-3 px-4 text-sm">{report.user}</td>
                          <td className="py-3 px-4 text-sm">{report.type}</td>
                          <td className="py-3 px-4 text-sm font-mono text-xs">{format(report.date, "MMM dd, yyyy")}</td>
                          <td className="py-3 px-4">
                            <Badge variant={report.status === "Submitted" ? "default" : "secondary"}>
                              {report.status}
                            </Badge>
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
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
