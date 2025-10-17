import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";
import { Plus, Users as UsersIcon } from "lucide-react";

interface CompanyData {
  id: number;
  name: string;
  maxAdmins: number;
  maxMembers: number;
  currentAdmins: number;
  currentMembers: number;
  isActive: boolean;
}

export default function Users() {
  const { toast } = useToast();
  const { dbUserId, companyId, userRole } = useAuth();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    userId: "",
    rating: "",
    feedback: "",
    period: "weekly",
  });
  const [userForm, setUserForm] = useState({
    email: "",
    displayName: "",
    password: "",
    role: "company_member",
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users?includeDeleted=true'],
  });

  const { data: company } = useQuery<CompanyData>({
    queryKey: ['/api/my-company'],
    enabled: !!companyId && !!dbUserId && userRole === 'company_admin',
  });

  const activeUsers = allUsers.filter(u => u.isActive !== false);
  const deletedUsers = allUsers.filter(u => u.isActive === false);

  const adminSlots = company 
    ? { current: company.currentAdmins, max: company.maxAdmins, available: company.maxAdmins - company.currentAdmins }
    : null;
  const memberSlots = company 
    ? { current: company.currentMembers, max: company.maxMembers, available: company.maxMembers - company.currentMembers }
    : null;

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users?includeDeleted=true'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-company'] });
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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof userForm) => {
      return await apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      toast({
        title: "User added successfully",
      });
      setUserForm({ email: "", displayName: "", password: "", role: "company_member" });
      setAddUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users?includeDeleted=true'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-company'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const canAddAdmin = !adminSlots || adminSlots.available > 0;
  const canAddMember = !memberSlots || memberSlots.available > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">User Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage users and their roles
          </p>
        </div>
        {userRole === 'company_admin' && (
          <Button
            onClick={() => setAddUserDialogOpen(true)}
            data-testid="button-add-user"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Slot Availability (for company admins) */}
      {company && userRole === 'company_admin' && (
        <Card data-testid="card-slot-availability">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Admin Slots</p>
                  <p className="text-lg font-semibold" data-testid="text-admin-slots-available">
                    {adminSlots?.available} / {adminSlots?.max} available
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Slots</p>
                  <p className="text-lg font-semibold" data-testid="text-member-slots-available">
                    {memberSlots?.available} / {memberSlots?.max} available
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-displayname">Display Name</Label>
              <Input
                id="user-displayname"
                placeholder="John Doe"
                value={userForm.displayName}
                onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                data-testid="input-user-displayname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="********"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(value) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger id="user-role" data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin" disabled={!canAddAdmin}>
                    Admin {!canAddAdmin && `(${adminSlots?.available}/${adminSlots?.max} slots)`}
                  </SelectItem>
                  <SelectItem value="company_member" disabled={!canAddMember}>
                    Member {!canAddMember && `(${memberSlots?.available}/${memberSlots?.max} slots)`}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(!canAddAdmin || !canAddMember) && (
              <p className="text-sm text-amber-600" data-testid="text-slot-warning">
                {!canAddAdmin && "Admin slots are full. "}
                {!canAddMember && "Member slots are full. "}
                Upgrade your plan to add more users.
              </p>
            )}
            <Button 
              onClick={() => createUserMutation.mutate(userForm)}
              disabled={
                !userForm.email || 
                !userForm.displayName || 
                !userForm.password || 
                createUserMutation.isPending ||
                (userForm.role === 'company_admin' && !canAddAdmin) ||
                (userForm.role === 'company_member' && !canAddMember)
              }
              data-testid="button-submit-add-user"
              className="w-full"
            >
              {createUserMutation.isPending ? "Adding..." : "Add User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
