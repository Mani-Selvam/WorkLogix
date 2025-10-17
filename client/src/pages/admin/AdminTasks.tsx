import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ListTodo, UserCheck } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { Task, User } from "@shared/schema";

export default function AdminTasks() {
  const { toast } = useToast();
  const { dbUserId } = useAuth();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    deadline: "",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: myTasks = [], isLoading: myTasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?assignedBy=${dbUserId}`],
    enabled: !!dbUserId,
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
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?assignedBy=${dbUserId}`] });
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

  const getUserNameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || "Unknown User";
  };

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Task Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Assign and track tasks
          </p>
        </div>
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Task</span>
            </Button>
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
                      {users.filter(u => u.role === 'company_member').map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.displayName}
                        </SelectItem>
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
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
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
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            All Tasks ({allTasks.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            My Created Tasks ({myTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">All Tasks ({allTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : allTasks.length > 0 ? (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Task</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Assigned To</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Priority</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Status</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTasks.map((task: any, index: number) => (
                          <tr
                            key={task.id}
                            className={`border-b ${index % 2 === 0 ? "bg-card" : "bg-muted/20"} hover-elevate`}
                            data-testid={`row-task-${task.id}`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-xs sm:text-sm">{task.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{task.description || '—'}</div>
                            </td>
                            <td className="py-3 px-4 text-xs sm:text-sm">{getUserNameById(task.assignedTo)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                {task.priority}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={task.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                {task.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono">
                              {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Tasks I Created ({myTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {myTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myTasks.length > 0 ? (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Task</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Assigned To</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Priority</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Status</th>
                          <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold">Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTasks.map((task: any, index: number) => (
                          <tr
                            key={task.id}
                            className={`border-b ${index % 2 === 0 ? "bg-card" : "bg-muted/20"} hover-elevate`}
                            data-testid={`row-task-${task.id}`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-xs sm:text-sm">{task.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{task.description || '—'}</div>
                            </td>
                            <td className="py-3 px-4 text-xs sm:text-sm">{getUserNameById(task.assignedTo)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                {task.priority}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={task.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                {task.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono">
                              {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  You haven't created any tasks yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
