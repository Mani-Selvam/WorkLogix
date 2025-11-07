import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock, TrendingUp, Award, CheckCircle, XCircle, AlertCircle, Eye, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";

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
  isOvertime: boolean;
  overtimeHours: number;
  pointsEarned: number;
  reportSubmitted: boolean;
  user: {
    id: number;
    displayName: string;
    photoURL: string | null;
    role: string;
    email: string;
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
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overtimeFilter, setOvertimeFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const { data: stats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ['/api/attendance/stats', companyId, today],
    enabled: !!companyId,
  });

  const useDateRange = startDate && endDate;
  const displayDate = startDate || today;
  
  const { data: todayLogs } = useQuery<CompanyAttendanceLog[]>({
    queryKey: useDateRange 
      ? ['/api/attendance/company', companyId, 'date-range', { startDate, endDate }]
      : ['/api/attendance/company', companyId, displayDate],
    queryFn: useDateRange
      ? async () => {
          const response = await fetch(`/api/attendance/company/${companyId}/date-range?startDate=${startDate}&endDate=${endDate}`);
          if (!response.ok) throw new Error('Failed to fetch date range');
          return response.json();
        }
      : undefined,
    enabled: !!companyId,
  });

  const { data: topPerformers } = useQuery<TopPerformer[]>({
    queryKey: ['/api/attendance/top-performers', companyId],
    enabled: !!companyId,
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/top-performers'] });
      setLastRefreshed(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, companyId]);

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/attendance/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/attendance/company'] });
    queryClient.invalidateQueries({ queryKey: ['/api/attendance/top-performers'] });
    setLastRefreshed(new Date());
  };

  const filteredLogs = useMemo(() => {
    if (!todayLogs) return [];
    
    return todayLogs.filter(log => {
      if (statusFilter !== "all") {
        if (statusFilter === "present" && log.status !== "present" && log.status !== "on-time") return false;
        if (statusFilter === "late" && log.status !== "late" && log.status !== "slightly-late" && log.status !== "very-late") return false;
        if (statusFilter === "absent" && log.status !== "absent") return false;
      }
      
      if (overtimeFilter === "overtime" && !log.isOvertime) return false;
      if (overtimeFilter === "no-overtime" && log.isOvertime) return false;
      
      if (reportFilter === "submitted" && !log.reportSubmitted) return false;
      if (reportFilter === "not-submitted" && log.reportSubmitted) return false;
      
      if (departmentFilter !== "all" && log.user.role !== departmentFilter) return false;
      
      return true;
    });
  }, [todayLogs, statusFilter, overtimeFilter, reportFilter, departmentFilter, startDate, endDate]);

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
            Monitor team attendance and performance in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-sm">
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-toggle-auto-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                data-testid="button-manual-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Now
              </Button>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              Last updated: {format(lastRefreshed, 'hh:mm:ss a')}
            </span>
          </div>
          <Calendar className="h-12 w-12 text-primary" />
        </div>
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
                        <AvatarFallback>{performer.displayName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`performer-name-${index}`}>
                          {performer.displayName || 'Unknown User'}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Attendance Tracker
              </CardTitle>
              <CardDescription>
                Real-time status of all employees for {format(new Date(), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={overtimeFilter} onValueChange={setOvertimeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-overtime">
                <SelectValue placeholder="All Overtime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Overtime</SelectItem>
                <SelectItem value="overtime">Has Overtime</SelectItem>
                <SelectItem value="no-overtime">No Overtime</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-report">
                <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="not-submitted">Not Submitted</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-department">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="company_member">Company Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="company_admin">Company Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Start Date"
                data-testid="input-start-date"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="End Date"
                data-testid="input-end-date"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setOvertimeFilter("all");
                setReportFilter("all");
                setDepartmentFilter("all");
                setStartDate("");
                setEndDate("");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
            
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {todayLogs?.length || 0} employees
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs && filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-4"
                  data-testid={`log-${index}`}
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={log.user.photoURL || ''} />
                      <AvatarFallback>{log.user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`log-name-${index}`}>
                        {log.user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {log.user.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Login</p>
                      <p className="font-medium">{formatTime(log.loginTime)}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Logout</p>
                      <p className="font-medium">{formatTime(log.logoutTime)}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Hours</p>
                      <p className="font-medium">{log.totalHours || 0} hrs</p>
                    </div>
                    
                    {log.isOvertime && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        OT: +{log.overtimeHours || 0}h
                      </Badge>
                    )}
                    
                    {log.reportSubmitted && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Report ✓
                      </Badge>
                    )}
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Points</p>
                      <p className="font-semibold text-green-600">+{log.pointsEarned}</p>
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
                      Details
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
