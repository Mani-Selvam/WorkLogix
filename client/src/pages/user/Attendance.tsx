import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock, Trophy, Award, TrendingUp, Flame, Target, Star, FileText, CheckCircle, LogIn, LogOut, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AttendanceLog {
  id: number;
  date: string;
  loginTime: string;
  logoutTime: string | null;
  status: string;
  totalHours: number;
  isLate: boolean;
  lateType: string | null;
  isOvertime: boolean;
  overtimeHours: number;
  pointsEarned: number;
  earlyLogoutReason: string | null;
  reportSubmitted: boolean;
}

interface AttendanceReward {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: string[];
  monthlyScore: number;
  perfectMonths: number;
}

interface MonthlyReport {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  averageHours: number;
  overtimeDays: number;
}

interface BadgeData {
  name: string;
  description: string;
  icon: string;
  type: string;
}

export default function Attendance() {
  const { dbUserId, companyId } = useAuth();
  const { toast } = useToast();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [notes, setNotes] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: todayLog, refetch: refetchTodayLog } = useQuery<AttendanceLog | null>({
    queryKey: ['/api/attendance/logs/today', dbUserId],
    enabled: !!dbUserId && !!companyId,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!todayLog) return;
    const intervalId = setInterval(() => {
      refetchTodayLog();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [todayLog, refetchTodayLog]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dbUserId?.toString() || '',
        },
        credentials: 'include',
        body: JSON.stringify({ companyId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark attendance');
      }
      return response.json();
    },
    onSuccess: (data: AttendanceLog) => {
      toast({
        title: "Login Successful!",
        description: `Attendance marked as ${data.status?.toUpperCase()}. ${data.lateType ? `Late type: ${data.lateType}` : 'You are on time!'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/logs/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/attendance/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dbUserId?.toString() || '',
        },
        credentials: 'include',
        body: JSON.stringify({ companyId, date: today }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark logout');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logout Successful!",
        description: "Your working hours and overtime have been calculated. See you tomorrow!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/logs/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to mark logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: todayReport } = useQuery<any>({
    queryKey: ['/api/tasks-report/today'],
    enabled: !!dbUserId,
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: { tasksCompleted: string; notes: string }) => {
      const response = await fetch('/api/tasks-report/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': dbUserId?.toString() || '',
        },
        credentials: 'include',
        body: JSON.stringify({ companyId, ...data }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit report');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your daily work report has been submitted successfully. You can now logout early if needed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-report/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/logs/today'] });
      setReportDialogOpen(false);
      setTasksCompleted("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit work report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: rewards } = useQuery<AttendanceReward>({
    queryKey: ['/api/attendance/rewards', dbUserId],
    enabled: !!dbUserId,
  });

  const { data: monthlyReport } = useQuery<MonthlyReport>({
    queryKey: ['/api/attendance/monthly-report', dbUserId],
    enabled: !!dbUserId,
  });

  const { data: recentLogs } = useQuery<AttendanceLog[]>({
    queryKey: ['/api/attendance/logs', dbUserId],
    enabled: !!dbUserId,
  });

  const { data: allBadges } = useQuery<BadgeData[]>({
    queryKey: ['/api/badges'],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const earnedBadges = allBadges?.filter(badge => 
    rewards?.badgesEarned?.includes(badge.name)
  ) || [];

  const attendancePercentage = monthlyReport && monthlyReport.totalDays > 0
    ? Math.round((monthlyReport.presentDays / monthlyReport.totalDays) * 100)
    : 0;

  const hasLoggedIn = !!todayLog && !!todayLog.loginTime;
  const hasLoggedOut = !!todayLog && !!todayLog.logoutTime;
  const canLogin = !hasLoggedIn;
  const canLogout = hasLoggedIn && !hasLoggedOut;

  const getTimeStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    if (timeStr <= '09:00') return { status: 'on-time', color: 'text-green-600', message: 'You are on time!' };
    if (timeStr <= '09:15') return { status: 'slightly-late', color: 'text-yellow-600', message: 'Slightly late, but within grace period' };
    if (timeStr <= '10:00') return { status: 'late', color: 'text-orange-600', message: 'You are late. Please login to start work.' };
    return { status: 'very-late', color: 'text-red-600', message: 'Very late. You can still login and work.' };
  };

  const timeStatus = getTimeStatus();

  return (
    <div className="space-y-6 p-6 bg-background" data-testid="page-attendance">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Portal</h1>
          <p className="text-muted-foreground mt-1">Track your attendance, streaks, and rewards</p>
        </div>
        <Award className="h-12 w-12 text-primary" />
      </div>

      <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 via-background to-primary/10" data-testid="card-attendance-controls">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Controls
            </span>
            <span className="text-lg font-mono" data-testid="text-current-time">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
          </CardTitle>
          <CardDescription>
            Mark your login and logout for today - Server Time: {format(currentTime, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasLoggedIn && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20" data-testid="alert-login-reminder">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className={`${timeStatus.color} font-medium`}>
                Current Status: {timeStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1 h-16 text-lg font-semibold"
              onClick={() => loginMutation.mutate()}
              disabled={!canLogin || loginMutation.isPending}
              variant={canLogin ? "default" : "outline"}
              data-testid="button-login-attendance"
            >
              {loginMutation.isPending ? (
                <><Clock className="mr-2 h-5 w-5 animate-spin" /> Marking Login...</>
              ) : hasLoggedIn ? (
                <><CheckCircle className="mr-2 h-5 w-5" /> Already Logged In</>
              ) : (
                <><LogIn className="mr-2 h-5 w-5" /> LOGIN NOW</>
              )}
            </Button>

            <Button
              size="lg"
              className="flex-1 h-16 text-lg font-semibold"
              onClick={() => logoutMutation.mutate()}
              disabled={!canLogout || logoutMutation.isPending}
              variant={canLogout ? "destructive" : "outline"}
              data-testid="button-logout-attendance"
            >
              {logoutMutation.isPending ? (
                <><Clock className="mr-2 h-5 w-5 animate-spin" /> Marking Logout...</>
              ) : hasLoggedOut ? (
                <><CheckCircle className="mr-2 h-5 w-5" /> Already Logged Out</>
              ) : !hasLoggedIn ? (
                <><AlertCircle className="mr-2 h-5 w-5" /> Please Login First</>
              ) : (
                <><LogOut className="mr-2 h-5 w-5" /> LOGOUT NOW</>
              )}
            </Button>
          </div>

          {hasLoggedIn && !hasLoggedOut && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20" data-testid="alert-logout-reminder">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Don't forget to logout!</strong> Your working hours will be calculated when you logout. 
                {todayReport && " You've submitted your report - you can logout early if needed."}
              </AlertDescription>
            </Alert>
          )}

          {hasLoggedIn && hasLoggedOut && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20" data-testid="alert-day-complete">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Great work today!</strong> Your attendance has been recorded. See you tomorrow!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {todayLog && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background" data-testid="card-today-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Real-Time Attendance
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(todayLog.status)} data-testid="badge-today-status">
                  {todayLog.status.toUpperCase()}
                </Badge>
                {todayLog.lateType && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1" data-testid="text-late-type">
                    {todayLog.lateType}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Login Time</p>
                <p className="text-lg font-semibold flex items-center gap-2" data-testid="text-login-time">
                  <Clock className="h-4 w-4" />
                  {formatTime(todayLog.loginTime)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Logout Time</p>
                <p className="text-lg font-semibold flex items-center gap-2" data-testid="text-logout-time">
                  <Clock className="h-4 w-4" />
                  {formatTime(todayLog.logoutTime)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-total-hours">
                  {todayLog.totalHours || 0} hrs
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
                <p className={`text-2xl font-bold ${todayLog.isOvertime ? 'text-orange-600' : 'text-muted-foreground'}`} data-testid="text-overtime-hours">
                  {todayLog.isOvertime ? `+${todayLog.overtimeHours} hrs` : '0 hrs'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Points Earned Today</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-points-today">
                  +{todayLog.pointsEarned} pts
                </p>
              </div>
            </div>
            
            {todayLog.earlyLogoutReason && (
              <div className="pt-2 border-t bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Early Logout Reason</p>
                <p className="text-sm font-medium mt-1" data-testid="text-early-logout-reason">
                  {todayLog.earlyLogoutReason}
                </p>
              </div>
            )}
            
            {todayReport ? (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-semibold">Work Report Submitted</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You have submitted your daily work report. Early logout is now allowed.
                </p>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-submit-report">
                      <FileText className="mr-2 h-4 w-4" />
                      Submit Daily Work Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Submit Daily Work Report</DialogTitle>
                      <DialogDescription>
                        Submit your completed tasks for today. After submission, you'll be allowed to logout early if needed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tasks">Tasks Completed Today *</Label>
                        <Textarea
                          id="tasks"
                          placeholder="List the tasks you completed today..."
                          value={tasksCompleted}
                          onChange={(e) => setTasksCompleted(e.target.value)}
                          className="min-h-[120px]"
                          data-testid="input-tasks-completed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any additional notes or comments..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[80px]"
                          data-testid="input-notes"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setReportDialogOpen(false)}
                        className="flex-1"
                        data-testid="button-cancel-report"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => submitReportMutation.mutate({ tasksCompleted, notes })}
                        disabled={!tasksCompleted.trim() || submitReportMutation.isPending}
                        className="flex-1"
                        data-testid="button-confirm-submit-report"
                      >
                        {submitReportMutation.isPending ? "Submitting..." : "Submit Report"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background" data-testid="card-current-streak">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600" data-testid="text-current-streak">
              {rewards?.currentStreak || 0} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it going!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background" data-testid="card-longest-streak">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Trophy className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600" data-testid="text-longest-streak">
              {rewards?.longestStreak || 0} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personal best
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background" data-testid="card-total-points">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-points">
              {rewards?.totalPoints || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime rewards
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background" data-testid="card-productivity">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productivity Level</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="text-productivity-score">
              {rewards?.monthlyScore || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly score
            </p>
          </CardContent>
        </Card>
      </div>

      {monthlyReport && (
        <Card data-testid="card-monthly-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Summary
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'MMMM yyyy')} Performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-semibold" data-testid="text-attendance-percentage">
                  {attendancePercentage}%
                </span>
              </div>
              <Progress value={attendancePercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Present Days</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-present-days">
                  {monthlyReport.presentDays}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-late-days">
                  {monthlyReport.lateDays}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Absent Days</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-absent-days">
                  {monthlyReport.absentDays}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Hours</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-avg-hours">
                  {monthlyReport.averageHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-badges">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            My Badges
          </CardTitle>
          <CardDescription>
            {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges.map((badge, index) => (
                <Card key={index} className="border-2 border-primary/20" data-testid={`badge-card-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">{badge.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`badge-name-${index}`}>
                          {badge.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No badges earned yet. Keep up your attendance to earn badges!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-monthly-calendar">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Calendar
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'MMMM yyyy')} - Color-coded attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2">
              <div className="text-muted-foreground">Sun</div>
              <div className="text-muted-foreground">Mon</div>
              <div className="text-muted-foreground">Tue</div>
              <div className="text-muted-foreground">Wed</div>
              <div className="text-muted-foreground">Thu</div>
              <div className="text-muted-foreground">Fri</div>
              <div className="text-muted-foreground">Sat</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];
                
                for (let i = 0; i < firstDay; i++) {
                  days.push(
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  );
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayLog = recentLogs?.find(log => log.date === dateStr);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  let bgColor = 'bg-gray-100 dark:bg-gray-800';
                  let textColor = 'text-gray-400 dark:text-gray-600';
                  let title = 'No data';
                  
                  if (dayLog) {
                    if (dayLog.status === 'present' || dayLog.status === 'on-time') {
                      bgColor = 'bg-green-100 dark:bg-green-900/30';
                      textColor = 'text-green-800 dark:text-green-200';
                      title = 'Present';
                      if (dayLog.reportSubmitted) {
                        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                        textColor = 'text-blue-800 dark:text-blue-200';
                        title = 'Present + Report';
                      }
                    } else if (dayLog.status === 'late' || dayLog.status === 'slightly-late' || dayLog.status === 'very-late') {
                      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                      textColor = 'text-yellow-800 dark:text-yellow-200';
                      title = 'Late';
                    } else if (dayLog.status === 'absent') {
                      bgColor = 'bg-red-100 dark:bg-red-900/30';
                      textColor = 'text-red-800 dark:text-red-200';
                      title = 'Absent';
                    }
                    
                    if (dayLog.isOvertime) {
                      bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                      textColor = 'text-orange-800 dark:text-orange-200';
                      title += ' + Overtime';
                    }
                  }
                  
                  days.push(
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${bgColor} ${textColor} ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''} hover:opacity-80 cursor-pointer`}
                      title={title}
                      data-testid={`calendar-day-${day}`}
                    >
                      {day}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
            
            <div className="flex flex-wrap gap-3 pt-4 border-t text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30"></div>
                <span>Report Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30"></div>
                <span>Overtime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-primary ring-offset-2"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-recent-logs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs && recentLogs.slice(0, 7).map((log, index) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                data-testid={`log-row-${index}`}
              >
                <div className="flex-1">
                  <p className="font-medium" data-testid={`log-date-${index}`}>
                    {format(new Date(log.date), 'EEE, MMM d')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(log.loginTime)} - {formatTime(log.logoutTime)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{log.totalHours || 0} hrs</p>
                    <p className="text-xs text-muted-foreground">+{log.pointsEarned} pts</p>
                  </div>
                  <Badge className={getStatusColor(log.status)} data-testid={`log-status-${index}`}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!recentLogs || recentLogs.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
