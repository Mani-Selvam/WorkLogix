import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import type { Feedback, User as UserType } from "@shared/schema";

type FeedbackWithUser = Feedback & { user?: UserType };

export default function AdminFeedback() {
  const { data: feedbacks = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ['/api/feedbacks'],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const getUserById = (userId: number) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">User Feedback</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          View all feedback submitted by users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            All Feedback ({feedbacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.map((feedback) => {
                const user = getUserById(feedback.userId);
                return (
                  <Card key={feedback.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user?.displayName?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">
                                {user?.displayName || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user?.email || 'No email'}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(feedback.createdAt), 'MMM dd, yyyy • h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {feedback.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No feedback yet</p>
                <p className="text-sm text-muted-foreground">
                  Feedback from users will appear here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
