import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceIssue {
  id: number;
  userId: number;
  issueType: string;
  date: string;
  requestedLoginTime?: string;
  requestedLogoutTime?: string;
  explanation: string;
  status: string;
  adminRemarks?: string;
  createdAt: string;
}

interface User {
  id: number;
  displayName: string;
  email: string;
  uniqueUserId: string;
}

export default function AttendanceIssueManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<AttendanceIssue | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: pendingIssues = [], isLoading } = useQuery<AttendanceIssue[]>({
    queryKey: ["/api/attendance-issues/pending"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ issueId, status, applyCorrection }: { issueId: number; status: string; applyCorrection: boolean }) => {
      return apiRequest("PATCH", `/api/attendance-issues/${issueId}`, {
        status,
        adminRemarks,
        applyCorrection,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Correction request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-issues/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/logs"] });
      setSelectedIssue(null);
      setAdminRemarks("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update correction request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (applyCorrection: boolean) => {
    if (selectedIssue) {
      updateIssueMutation.mutate({
        issueId: selectedIssue.id,
        status: "approved",
        applyCorrection,
      });
    }
  };

  const handleReject = () => {
    if (selectedIssue) {
      updateIssueMutation.mutate({
        issueId: selectedIssue.id,
        status: "rejected",
        applyCorrection: false,
      });
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.displayName : "Unknown User";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredIssues = statusFilter === "all"
    ? pendingIssues
    : pendingIssues.filter(issue => issue.status === statusFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Attendance Correction Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve/reject employee attendance corrections
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12" data-testid="loading-state">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-issues">
                  No {statusFilter !== "all" ? statusFilter : ""} correction requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} data-testid={`card-issue-${issue.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-user-name-${issue.id}`}>
                            {getUserName(issue.userId)}
                          </span>
                        </div>
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
                    {issue.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => setSelectedIssue(issue)}
                          variant="default"
                          data-testid={`button-review-${issue.id}`}
                        >
                          Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Correction Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this attendance correction request
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Employee: </span>
                  {getUserName(selectedIssue.userId)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Type: </span>
                  {getIssueTypeLabel(selectedIssue.issueType)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Date: </span>
                  {format(new Date(selectedIssue.date), "MMM dd, yyyy")}
                </div>
                {selectedIssue.requestedLoginTime && (
                  <div className="text-sm">
                    <span className="font-medium">Requested Login: </span>
                    {format(new Date(selectedIssue.requestedLoginTime), "hh:mm a")}
                  </div>
                )}
                {selectedIssue.requestedLogoutTime && (
                  <div className="text-sm">
                    <span className="font-medium">Requested Logout: </span>
                    {format(new Date(selectedIssue.requestedLogoutTime), "hh:mm a")}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Explanation: </span>
                  <p className="mt-1 text-muted-foreground">
                    {selectedIssue.explanation}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Remarks (Optional)</label>
                <Textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Add any remarks..."
                  rows={3}
                  data-testid="textarea-admin-remarks"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleApprove(true)}
                  disabled={updateIssueMutation.isPending}
                  data-testid="button-approve-apply"
                  className="w-full"
                >
                  Approve & Apply Correction
                </Button>
                <Button
                  onClick={() => handleApprove(false)}
                  disabled={updateIssueMutation.isPending}
                  variant="secondary"
                  data-testid="button-approve-only"
                  className="w-full"
                >
                  Approve Only (No Changes)
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={updateIssueMutation.isPending}
                  variant="destructive"
                  data-testid="button-reject"
                  className="w-full"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
