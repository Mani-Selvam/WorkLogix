import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Trophy, TrendingUp, Award, User, Edit, FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPDF = async () => {
    if (!profile) return;
    
    setIsExporting(true);
    toast({
      title: "Generating PDF",
      description: "Please wait while we prepare your PDF...",
    });

    try {
      const element = document.getElementById('attendance-profile-content');
      if (!element) throw new Error('Content not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      let heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${profile.employee.displayName}_Attendance_Profile_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Your PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
      case 'on-time':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'late':
      case 'slightly-late':
      case 'very-late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'leave':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'holiday':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getCalendarDayColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
      case 'on-time':
        return 'bg-green-500 hover:bg-green-600';
      case 'late':
      case 'slightly-late':
        return 'bg-yellow-400 hover:bg-yellow-500';
      case 'very-late':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'absent':
        return 'bg-red-500 hover:bg-red-600';
      case 'leave':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'holiday':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    }
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return profile?.attendanceLogs.find(log => log.date === dateStr);
  };

  const monthStart = startOfMonth(currentCalendarDate);
  const monthEnd = endOfMonth(currentCalendarDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setLocation("/admin/attendance")} data-testid="button-back">
          ← Back to Overview
        </Button>
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          data-testid="button-export-pdf"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Generating PDF..." : "Export as PDF"}
        </Button>
      </div>

      <div id="attendance-profile-content" className="space-y-6">

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

      {/* Detailed Performance Analytics */}
      <Card data-testid="card-detailed-analytics">
        <CardHeader>
          <CardTitle>Detailed Performance Analytics</CardTitle>
          <CardDescription>Comprehensive attendance and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Login Time</p>
              <p className="text-xl font-bold" data-testid="text-avg-login">
                {(() => {
                  const logins = profile.attendanceLogs.filter(log => log.loginTime);
                  if (logins.length === 0) return 'N/A';
                  const totalMinutes = logins.reduce((sum, log) => {
                    const time = new Date(log.loginTime!);
                    return sum + (time.getHours() * 60 + time.getMinutes());
                  }, 0);
                  const avgMinutes = totalMinutes / logins.length;
                  const hours = Math.floor(avgMinutes / 60);
                  const mins = Math.round(avgMinutes % 60);
                  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                })()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Logout Time</p>
              <p className="text-xl font-bold" data-testid="text-avg-logout">
                {(() => {
                  const logouts = profile.attendanceLogs.filter(log => log.logoutTime);
                  if (logouts.length === 0) return 'N/A';
                  const totalMinutes = logouts.reduce((sum, log) => {
                    const time = new Date(log.logoutTime!);
                    return sum + (time.getHours() * 60 + time.getMinutes());
                  }, 0);
                  const avgMinutes = totalMinutes / logouts.length;
                  const hours = Math.floor(avgMinutes / 60);
                  const mins = Math.round(avgMinutes % 60);
                  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                })()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Productivity Days</p>
              <p className="text-xl font-bold text-green-600" data-testid="text-productivity-days">
                {profile.attendanceLogs.filter(log => log.reportSubmitted).length}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.monthlyReport.totalDays > 0 
                  ? `${((profile.attendanceLogs.filter(log => log.reportSubmitted).length / profile.monthlyReport.totalDays) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Performance Index</p>
              <p className="text-xl font-bold text-blue-600" data-testid="text-performance-index">
                {profile.monthlyReport.totalDays > 0 
                  ? ((profile.monthlyReport.presentDays / profile.monthlyReport.totalDays) * 100).toFixed(1)
                  : '0'}%
              </p>
              <p className="text-xs text-muted-foreground">
                Based on attendance rate
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Overtime</p>
              <p className="text-xl font-bold text-orange-600" data-testid="text-total-overtime">
                {profile.attendanceLogs.reduce((sum, log) => sum + (log.overtimeHours || 0), 0)}h
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Punctuality Rate</p>
              <p className="text-xl font-bold text-green-600" data-testid="text-punctuality-rate">
                {profile.monthlyReport.totalDays > 0 
                  ? (((profile.monthlyReport.totalDays - profile.monthlyReport.lateDays) / profile.monthlyReport.totalDays) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Report Submission</p>
              <p className="text-xl font-bold text-blue-600" data-testid="text-report-rate">
                {profile.monthlyReport.totalDays > 0 
                  ? ((profile.attendanceLogs.filter(log => log.reportSubmitted).length / profile.monthlyReport.totalDays) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Attendance Score</p>
              <p className="text-xl font-bold text-purple-600" data-testid="text-attendance-score">
                {profile.rewards?.monthlyScore || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Current month score
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Calendar View */}
      <Card data-testid="card-monthly-calendar">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Calendar</CardTitle>
              <CardDescription>Color-coded attendance calendar with overtime and report indicators</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 text-sm font-medium">
                {format(currentCalendarDate, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>Very Late</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Report</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Overtime</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
                {day}
              </div>
            ))}
            
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}
            
            {daysInMonth.map((day, index) => {
              const attendance = getAttendanceForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={index}
                  className={`aspect-square p-1 rounded-lg border transition-all ${
                    isToday ? 'ring-2 ring-primary' : ''
                  } ${
                    attendance ? getCalendarDayColor(attendance.status) + ' text-white' : 'bg-background hover:bg-accent'
                  }`}
                  data-testid={`calendar-day-${format(day, 'dd')}`}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-xs font-medium ${attendance ? 'text-white' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    {attendance && (
                      <div className="flex gap-0.5 mt-auto justify-center">
                        {attendance.reportSubmitted && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {attendance.isOvertime && (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                        <div className="flex gap-2" style={{ display: isExporting ? 'none' : 'flex' }}>
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
      </div>

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
