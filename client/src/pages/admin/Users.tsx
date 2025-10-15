import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Users() {
  const { toast } = useToast();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    userId: "",
    rating: "",
    feedback: "",
    period: "weekly",
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users?includeDeleted=true'],
  });

  const activeUsers = allUsers.filter(u => u.isActive !== false);
  const deletedUsers = allUsers.filter(u => u.isActive === false);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User removed successfully",
        description: "The user has been deleted from the system.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createRatingMutation = useMutation({
    mutationFn: async (ratingData: typeof ratingForm) => {
      return await apiRequest('POST', '/api/ratings', {
        userId: parseInt(ratingData.userId),
        rating: ratingData.rating,
        feedback: ratingData.feedback || null,
        period: ratingData.period,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted successfully",
      });
      setRatingForm({ userId: "", rating: "", feedback: "", period: "weekly" });
      setRatingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ratings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">User Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage users and their roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Active Users ({activeUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {activeUsers.map((user) => (
                <Card key={user.id} data-testid={`card-user-${user.id}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                          {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{user.displayName}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                      {user.role !== 'admin' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-8"
                            data-testid={`button-rate-user-${user.id}`}
                            onClick={() => {
                              setRatingForm({ ...ratingForm, userId: user.id.toString() });
                              setRatingDialogOpen(true);
                            }}
                          >
                            Rate
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive text-xs h-8"
                            data-testid={`button-remove-user-${user.id}`}
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? "..." : "Remove"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active users found
            </div>
          )}
        </CardContent>
      </Card>

      {deletedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Removed Users ({deletedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {deletedUsers.map((user) => (
                <Card key={user.id} className="opacity-60">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs sm:text-sm">
                          {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{user.displayName}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Removed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate User</DialogTitle>
            <DialogDescription>
              Provide feedback and rating for the selected user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating-period">Period</Label>
              <Select 
                value={ratingForm.period} 
                onValueChange={(value) => setRatingForm({ ...ratingForm, period: value })}
              >
                <SelectTrigger id="rating-period" data-testid="select-rating-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating-value">Rating</Label>
              <Select 
                value={ratingForm.rating} 
                onValueChange={(value) => setRatingForm({ ...ratingForm, rating: value })}
              >
                <SelectTrigger id="rating-value" data-testid="select-rating-value">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                  <SelectItem value="Very Good">⭐⭐⭐⭐ Very Good</SelectItem>
                  <SelectItem value="Good">⭐⭐⭐ Good</SelectItem>
                  <SelectItem value="Average">⭐⭐ Average</SelectItem>
                  <SelectItem value="Needs Improvement">⭐ Needs Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating-feedback">Feedback (Optional)</Label>
              <Textarea
                id="rating-feedback"
                placeholder="Provide additional feedback..."
                value={ratingForm.feedback}
                onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                data-testid="textarea-rating-feedback"
                rows={4}
              />
            </div>
            <Button 
              onClick={() => createRatingMutation.mutate(ratingForm)}
              disabled={!ratingForm.userId || !ratingForm.rating || createRatingMutation.isPending}
              data-testid="button-submit-rating"
              className="w-full"
            >
              {createRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
