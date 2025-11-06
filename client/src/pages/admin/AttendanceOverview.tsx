import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock, TrendingUp, Award, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onTimePercentage: number;
}

interface CompanyAttendanceLog {
  id: number;
  userId: number;
  date: string;
  loginTime: string;
  logoutTime: string | null;
  status: string;
  totalHours: number;
  isLate: boolean;
  pointsEarned: number;
  user: {
    displayName: string;
    photoURL: string | null;
  };
}

interface TopPerformer {
  userId: number;
  displayName: string;
  photoURL: string | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: string[];
}

export default function AttendanceOverview() {
  const { companyId } = useAuth();
  const [, setLocation] = useLocation();
  const today = new Date().toISOString().split('T')[0];

  const { data: stats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ['/api/attendance/stats', companyId, today],
    enabled: !!companyId,
  });

  const { data: todayLogs } = useQuery<CompanyAttendanceLog[]>({
    queryKey: ['/api/attendance/company', companyId, today],
    enabled: !!companyId,
  });

  const { data: topPerformers } = useQuery<TopPerformer[]>({
    queryKey: ['/api/attendance/top-performers', companyId],
    enabled: !!companyId,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

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

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background" data-testid="page-attendance-overview">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor team attendance and performance
          </p>
        </div>
        <Calendar className="h-12 w-12 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background" data-testid="card-total-employees">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="text-total-employees">
              {stats?.totalEmployees || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background" data-testid="card-present-today">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-present-today">
              {stats?.presentToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On time: {stats?.onTimePercentage || 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background" data-testid="card-late-today">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-late-today">
              {stats?.lateToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After 9:15 AM
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background" data-testid="card-absent-today">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600" data-testid="text-absent-today">
              {stats?.absentToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No login
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-top-performers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Employees with highest attendance scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers && topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div 
                    key={performer.userId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    data-testid={`performer-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={performer.photoURL || ''} />
                        <AvatarFallback>{performer.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`performer-name-${index}`}>
                          {performer.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {performer.currentStreak} day streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary" data-testid={`performer-points-${index}`}>
                        {performer.totalPoints} pts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {performer.badgesEarned?.length || 0} badges
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No performance data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-attendance-rate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Attendance Rate
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Present</span>
                <span className="font-semibold text-green-600">
                  {stats?.presentToday || 0} / {stats?.totalEmployees || 0}
                </span>
              </div>
              <Progress 
                value={stats?.totalEmployees ? (stats.presentToday / stats.totalEmployees) * 100 : 0} 
                className="h-2 bg-green-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Late</span>
                <span className="font-semibold text-yellow-600">
                  {stats?.lateToday || 0} / {stats?.totalEmployees || 0}
                </span>
              </div>
              <Progress 
                value={stats?.totalEmployees ? (stats.lateToday / stats.totalEmployees) * 100 : 0} 
                className="h-2 bg-yellow-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Absent</span>
                <span className="font-semibold text-red-600">
                  {stats?.absentToday || 0} / {stats?.totalEmployees || 0}
                </span>
              </div>
              <Progress 
                value={stats?.totalEmployees ? (stats.absentToday / stats.totalEmployees) * 100 : 0} 
                className="h-2 bg-red-100"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-live-attendance">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Attendance Tracker
          </CardTitle>
          <CardDescription>
            Real-time status of all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayLogs && todayLogs.length > 0 ? (
              todayLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  data-testid={`log-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={log.user.photoURL || ''} />
                      <AvatarFallback>{log.user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`log-name-${index}`}>
                        {log.user.displayName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Login: {formatTime(log.loginTime)} • Logout: {formatTime(log.logoutTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{log.totalHours || 0} hrs</p>
                      <p className="text-xs text-muted-foreground">+{log.pointsEarned} pts</p>
                    </div>
                    <Badge className={getStatusColor(log.status)} data-testid={`log-status-${index}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/employee/${log.userId}/attendance`)}
                      data-testid={`button-view-details-${index}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records for today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
