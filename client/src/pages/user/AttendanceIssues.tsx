import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AttendanceIssueDialog from "@/components/AttendanceIssueDialog";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AttendanceIssue {
  id: number;
  issueType: string;
  date: string;
  requestedLoginTime?: string;
  requestedLogoutTime?: string;
  explanation: string;
  status: string;
  adminRemarks?: string;
  createdAt: string;
}

export default function AttendanceIssues() {
  const { data: issues = [], isLoading } = useQuery<AttendanceIssue[]>({
    queryKey: ["/api/attendance-issues"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1" data-testid={`status-${status}`}>
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500" data-testid={`status-${status}`}>
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1" data-testid={`status-${status}`}>
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "login_correction":
        return "Login Time Correction";
      case "logout_correction":
        return "Logout Time Correction";
      case "late_explanation":
        return "Late Explanation";
      default:
        return "Other";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Attendance Corrections
          </h1>
          <p className="text-muted-foreground mt-1">
            Request corrections for your attendance records
          </p>
        </div>
        <AttendanceIssueDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12" data-testid="loading-state">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-issues">
              No correction requests yet. Click "Request Correction" to submit one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <Card key={issue.id} data-testid={`card-issue-${issue.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {getIssueTypeLabel(issue.issueType)}
                    </CardTitle>
                    <CardDescription>
                      Date: {format(new Date(issue.date), "MMM dd, yyyy")}
                    </CardDescription>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {issue.requestedLoginTime && (
                  <div className="text-sm">
                    <span className="font-medium">Requested Login Time: </span>
                    <span data-testid={`text-login-time-${issue.id}`}>
                      {format(new Date(issue.requestedLoginTime), "hh:mm a")}
                    </span>
                  </div>
                )}
                {issue.requestedLogoutTime && (
                  <div className="text-sm">
                    <span className="font-medium">Requested Logout Time: </span>
                    <span data-testid={`text-logout-time-${issue.id}`}>
                      {format(new Date(issue.requestedLogoutTime), "hh:mm a")}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Explanation: </span>
                  <p className="mt-1 text-muted-foreground" data-testid={`text-explanation-${issue.id}`}>
                    {issue.explanation}
                  </p>
                </div>
                {issue.adminRemarks && (
                  <div className="text-sm border-t pt-3">
                    <span className="font-medium">Admin Remarks: </span>
                    <p className="mt-1 text-muted-foreground" data-testid={`text-admin-remarks-${issue.id}`}>
                      {issue.adminRemarks}
                    </p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Submitted: {format(new Date(issue.createdAt), "MMM dd, yyyy hh:mm a")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
