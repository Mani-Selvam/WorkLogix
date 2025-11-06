import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Trophy, TrendingUp, Award, User, Edit, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmployeeProfile {
  employee: {
    id: number;
    uniqueUserId: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    role: string;
    createdAt: string;
  };
  attendanceLogs: Array<{
    id: number;
    date: string;
    loginTime: string | null;
    logoutTime: string | null;
    status: string;
    totalHours: number;
    isLate: boolean;
    lateType: string | null;
    isOvertime: boolean;
    overtimeHours: number;
    pointsEarned: number;
    reportSubmitted: boolean;
    notes: string | null;
  }>;
  rewards: {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    badgesEarned: string[];
    monthlyScore: number;
    perfectMonths: number;
  } | null;
  monthlyReport: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    totalPoints: number;
    averageHours: number;
  };
  leaves: Array<{
    id: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
  }>;
}

export default function EmployeeAttendanceDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const userId = parseInt(params.userId as string);
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loginTime, setLoginTime] = useState("");
  const [logoutTime, setLogoutTime] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: profile, isLoading } = useQuery<EmployeeProfile>({
    queryKey: [`/api/admin/employee/${userId}/attendance-profile`],
    enabled: !!userId,
  });

  const editTimesMutation = useMutation({
    mutationFn: async (data: { logId: number; loginTime?: string; logoutTime?: string }) => {
      return await apiRequest("POST", "/api/admin/attendance/edit-times", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance times updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/employee/${userId}/attendance-profile`] });
      setEditDialogOpen(false);
      setSelectedLog(null);
      setLoginTime("");
      setLogoutTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance times",
        variant: "destructive",
      });
    },
  });

  const addRemarksMutation = useMutation({
    mutationFn: async (data: { logId: number; remarks: string }) => {
      return await apiRequest("POST", "/api/admin/attendance/add-remarks", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Remarks added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/employee/${userId}/attendance-profile`] });
      setRemarksDialogOpen(false);
      setSelectedLog(null);
      setRemarks("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add remarks",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (log: any) => {
    setSelectedLog(log);
    setLoginTime(log.loginTime ? format(new Date(log.loginTime), "HH:mm") : "");
    setLogoutTime(log.logoutTime ? format(new Date(log.logoutTime), "HH:mm") : "");
    setEditDialogOpen(true);
  };

  const handleRemarksClick = (log: any) => {
    setSelectedLog(log);
    setRemarks(log.notes || "");
    setRemarksDialogOpen(true);
  };

  const handleSaveTimes = () => {
    if (!selectedLog) return;
    
    const loginDateTime = loginTime ? `${selectedLog.date}T${loginTime}:00` : undefined;
    const logoutDateTime = logoutTime ? `${selectedLog.date}T${logoutTime}:00` : undefined;
    
    editTimesMutation.mutate({
      logId: selectedLog.id,
      loginTime: loginDateTime,
      logoutTime: logoutDateTime,
    });
  };

  const handleSaveRemarks = () => {
    if (!selectedLog) return;
    addRemarksMutation.mutate({
      logId: selectedLog.id,
      remarks,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p>Employee not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setLocation("/admin/attendance")} data-testid="button-back">
          ← Back to Overview
        </Button>
      </div>

      {/* Personal Info Section */}
      <Card data-testid="card-employee-info">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.employee.photoURL || ""} />
              <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle data-testid="text-employee-name">{profile.employee.displayName}</CardTitle>
              <CardDescription>{profile.employee.email}</CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" data-testid="badge-employee-id">
                  ID: {profile.employee.uniqueUserId}
                </Badge>
                <Badge variant="outline">{profile.employee.role}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-points">
              {profile.rewards?.totalPoints || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-current-streak">
              {profile.rewards?.currentStreak || 0} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-longest-streak">
              {profile.rewards?.longestStreak || 0} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Perfect Months</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-perfect-months">
              {profile.rewards?.perfectMonths || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report Summary */}
      <Card data-testid="card-monthly-report">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Current month attendance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Present Days</p>
              <p className="text-2xl font-bold text-green-600" data-testid="text-present-days">
                {profile.monthlyReport.presentDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600" data-testid="text-late-days">
                {profile.monthlyReport.lateDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absent Days</p>
              <p className="text-2xl font-bold text-red-600" data-testid="text-absent-days">
                {profile.monthlyReport.absentDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Working Days</p>
              <p className="text-2xl font-bold" data-testid="text-total-days">
                {profile.monthlyReport.totalDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
              <p className="text-2xl font-bold" data-testid="text-avg-hours">
                {profile.monthlyReport.averageHours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Points</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-monthly-points">
                {profile.monthlyReport.totalPoints}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Logs Table */}
      <Card data-testid="card-attendance-logs">
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>Detailed daily attendance records for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Login</th>
                  <th className="text-left p-2">Logout</th>
                  <th className="text-left p-2">Hours</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Points</th>
                  <th className="text-left p-2">Report</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profile.attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      No attendance records for this month
                    </td>
                  </tr>
                ) : (
                  profile.attendanceLogs.map((log) => (
                    <tr key={log.id} className="border-b" data-testid={`row-log-${log.id}`}>
                      <td className="p-2">{format(new Date(log.date), "MMM dd, yyyy")}</td>
                      <td className="p-2">
                        {log.loginTime ? format(new Date(log.loginTime), "hh:mm a") : "N/A"}
                      </td>
                      <td className="p-2">
                        {log.logoutTime ? format(new Date(log.logoutTime), "hh:mm a") : "N/A"}
                      </td>
                      <td className="p-2">{log.totalHours}h</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                          {log.isLate && log.lateType && ` (${log.lateType})`}
                        </Badge>
                      </td>
                      <td className="p-2 font-semibold">{log.pointsEarned}</td>
                      <td className="p-2">
                        {log.reportSubmitted ? (
                          <Badge variant="outline" className="bg-blue-50">Submitted</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(log)}
                            data-testid={`button-edit-${log.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemarksClick(log)}
                            data-testid={`button-remarks-${log.id}`}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Remarks
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {profile.rewards && profile.rewards.badgesEarned && profile.rewards.badgesEarned.length > 0 && (
        <Card data-testid="card-badges">
          <CardHeader>
            <CardTitle>Badges Earned</CardTitle>
            <CardDescription>Achievement badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.rewards.badgesEarned.map((badge, index) => (
                <Badge key={index} variant="secondary" className="text-sm" data-testid={`badge-${index}`}>
                  <Award className="h-3 w-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Times Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-times">
          <DialogHeader>
            <DialogTitle>Edit Attendance Times</DialogTitle>
            <DialogDescription>
              Correct the login and logout times for {selectedLog && format(new Date(selectedLog.date), "MMMM dd, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-time">Login Time</Label>
              <Input
                id="login-time"
                type="time"
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
                data-testid="input-login-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logout-time">Logout Time</Label>
              <Input
                id="logout-time"
                type="time"
                value={logoutTime}
                onChange={(e) => setLogoutTime(e.target.value)}
                data-testid="input-logout-time"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTimes}
              disabled={editTimesMutation.isPending}
              data-testid="button-save-times"
            >
              {editTimesMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent data-testid="dialog-remarks">
          <DialogHeader>
            <DialogTitle>Add Remarks</DialogTitle>
            <DialogDescription>
              Add admin remarks/notes for {selectedLog && format(new Date(selectedLog.date), "MMMM dd, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks/Notes</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks or notes about this attendance record..."
                className="min-h-[120px]"
                data-testid="input-remarks"
              />
              {selectedLog?.notes && (
                <p className="text-xs text-muted-foreground">
                  Current notes: {selectedLog.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRemarksDialogOpen(false)}
              data-testid="button-cancel-remarks"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRemarks}
              disabled={addRemarksMutation.isPending}
              data-testid="button-save-remarks"
            >
              {addRemarksMutation.isPending ? "Saving..." : "Save Remarks"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
