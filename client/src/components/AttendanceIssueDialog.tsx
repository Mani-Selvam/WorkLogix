import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

const issueSchema = z.object({
  issueType: z.enum(["login_correction", "logout_correction", "late_explanation", "other"]),
  date: z.string().min(1, "Date is required"),
  requestedLoginTime: z.string().optional(),
  requestedLogoutTime: z.string().optional(),
  explanation: z.string().min(10, "Explanation must be at least 10 characters"),
});

type IssueFormData = z.infer<typeof issueSchema>;

export default function AttendanceIssueDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueType: "login_correction",
      date: "",
      requestedLoginTime: "",
      requestedLogoutTime: "",
      explanation: "",
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: IssueFormData) => {
      const payload: any = {
        issueType: data.issueType,
        date: data.date,
        explanation: data.explanation,
      };

      if (data.requestedLoginTime) {
        const loginDateTime = new Date(`${data.date}T${data.requestedLoginTime}`);
        payload.requestedLoginTime = loginDateTime.toISOString();
      }

      if (data.requestedLogoutTime) {
        const logoutDateTime = new Date(`${data.date}T${data.requestedLogoutTime}`);
        payload.requestedLogoutTime = logoutDateTime.toISOString();
      }

      return apiRequest("POST", "/api/attendance-issues", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Correction request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-issues"] });
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit correction request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IssueFormData) => {
    createIssueMutation.mutate(data);
  };

  const issueType = form.watch("issueType");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" data-testid="button-request-correction">
            <AlertCircle className="mr-2 h-4 w-4" />
            Request Correction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Attendance Correction</DialogTitle>
          <DialogDescription>
            Submit a request to correct your attendance record. Admin will review and approve/reject.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-issue-type">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="login_correction">Login Time Correction</SelectItem>
                      <SelectItem value="logout_correction">Logout Time Correction</SelectItem>
                      <SelectItem value="late_explanation">Late Explanation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      data-testid="input-date"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(issueType === "login_correction" || issueType === "other") && (
              <FormField
                control={form.control}
                name="requestedLoginTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Login Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-login-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(issueType === "logout_correction" || issueType === "other") && (
              <FormField
                control={form.control}
                name="requestedLogoutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Logout Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-logout-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain why you need this correction..."
                      className="resize-none"
                      rows={4}
                      data-testid="textarea-explanation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createIssueMutation.isPending}
                data-testid="button-submit-request"
              >
                {createIssueMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
