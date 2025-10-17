import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";
import { Plus, Users as UsersIcon, Copy, CheckCircle } from "lucide-react";

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
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    email: string;
    password: string;
    uniqueUserId: string;
    displayName: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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
      const response = await apiRequest('POST', '/api/users', userData);
      return await response.json() as User;
    },
    onSuccess: (data: User) => {
      setCreatedUserCredentials({
        email: data.email,
        password: userForm.password,
        uniqueUserId: data.uniqueUserId,
        displayName: data.displayName,
      });
      setUserForm({ email: "", displayName: "", password: "", role: "company_member" });
      setAddUserDialogOpen(false);
      setCredentialsDialogOpen(true);
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied to clipboard",
        description: `${field} has been copied`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

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
                <Card key={user.id} data-testid={`card-user-${user.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-semibold text-base truncate">{user.displayName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <Badge 
                          variant={user.role === 'company_admin' ? 'default' : 'secondary'} 
                          className="text-xs mt-1"
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {user.role === 'company_member' && (
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-xs h-8"
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
                          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                          data-testid={`button-remove-user-${user.id}`}
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          {deleteUserMutation.isPending ? "..." : "Remove"}
                        </Button>
                      </div>
                    )}
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

      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these credentials with the user so they can log in. They will need all three pieces of information.
            </DialogDescription>
          </DialogHeader>
          
          {createdUserCredentials && (
            <div className="space-y-4">
              <Alert data-testid="alert-user-credentials">
                <AlertDescription className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Login Instructions for User:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Go to the login page and select "Company User" tab</li>
                      <li>Enter the Username, User ID, and Password provided below</li>
                      <li>Click "Login" to access the company dashboard</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <Label className="text-sm text-muted-foreground">Username (Display Name)</Label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-semibold" data-testid="text-created-username">
                      {createdUserCredentials.displayName}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUserCredentials.displayName, 'Username')}
                      data-testid="button-copy-username"
                    >
                      {copiedField === 'Username' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <Label className="text-sm text-muted-foreground">User ID (Required for Login)</Label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-semibold" data-testid="text-created-userid">
                      {createdUserCredentials.uniqueUserId}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUserCredentials.uniqueUserId, 'User ID')}
                      data-testid="button-copy-userid"
                    >
                      {copiedField === 'User ID' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-semibold" data-testid="text-created-email">
                      {createdUserCredentials.email}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUserCredentials.email, 'Email')}
                      data-testid="button-copy-email"
                    >
                      {copiedField === 'Email' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <Label className="text-sm text-muted-foreground">Password (Set by Admin)</Label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-semibold" data-testid="text-created-password">
                      {createdUserCredentials.password}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUserCredentials.password, 'Password')}
                      data-testid="button-copy-password"
                    >
                      {copiedField === 'Password' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-sm text-amber-800">
                  ⚠️ Important: Save these credentials now. The password will not be shown again for security reasons.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => {
                  setCredentialsDialogOpen(false);
                  setCreatedUserCredentials(null);
                }}
                className="w-full"
                data-testid="button-close-credentials"
              >
                I've Saved the Credentials
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
