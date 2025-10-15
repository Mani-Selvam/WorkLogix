import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();
  const { dbUserId } = useAuth();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('POST', '/api/feedbacks', {
        userId: dbUserId,
        message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your feedback has been submitted",
      });
      setFeedback("");
      queryClient.invalidateQueries({ queryKey: ['/api/feedbacks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate(feedback);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Feedback</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Share your thoughts and suggestions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={8}
            data-testid="textarea-feedback"
          />
          <Button 
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending}
            data-testid="button-submit-feedback"
          >
            {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
