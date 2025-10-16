import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import loginHeroImage from "@assets/stock_images/workspace_desk_lapto_4a3916c9.jpg";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, userRole, setUser, setUserRole, setDbUserId, setCompanyId } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  const [superAdminData, setSuperAdminData] = useState({ email: "", password: "" });
  const [companyRegData, setCompanyRegData] = useState({ name: "", email: "", password: "" });
  const [companyAdminData, setCompanyAdminData] = useState({ companyName: "", email: "", serverId: "", password: "" });
  const [companyUserData, setCompanyUserData] = useState({ username: "", serverId: "", password: "" });

  useEffect(() => {
    if (user && userRole) {
      const isAdmin = userRole === "super_admin" || userRole === "company_admin";
      const isUser = userRole === "company_member";
      if (isAdmin) {
        setLocation("/admin");
      } else if (isUser) {
        setLocation("/user");
      }
    }
  }, [user, userRole, setLocation]);

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/auth/super-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superAdminData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      setCompanyId(userData.companyId || null);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      setError(error.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleCompanyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyRegData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      const data = await response.json();
      toast({
        title: "Success!",
        description: data.message,
        duration: 10000,
      });
      setCompanyRegData({ name: "", email: "", password: "" });
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || "Registration failed");
      setIsLoading(false);
    }
  };

  const handleCompanyAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/auth/company-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyAdminData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const userData = await response.json();
      if (userData.message) {
        toast({
          title: "Welcome!",
          description: userData.message,
          duration: 10000,
        });
      }
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      setCompanyId(userData.companyId || null);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      setError(error.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleCompanyUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/auth/company-user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyUserData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      setCompanyId(userData.companyId || null);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      setError(error.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={loginHeroImage}
          alt="Professional workspace"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">WorkLogix</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Employee Work Tracking & Task Management</p>
          </div>

          <Tabs defaultValue="super-admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="super-admin" data-testid="tab-super-admin">Super Admin</TabsTrigger>
              <TabsTrigger value="company-reg" data-testid="tab-company-register">Register Company</TabsTrigger>
              <TabsTrigger value="company-admin" data-testid="tab-company-admin">Company Admin</TabsTrigger>
              <TabsTrigger value="company-user" data-testid="tab-company-user">Company User</TabsTrigger>
            </TabsList>
            
            <TabsContent value="super-admin">
              <Card>
                <CardHeader>
                  <CardTitle>Super Admin Login</CardTitle>
                  <CardDescription>Access server-level controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="super-email">Email</Label>
                      <Input
                        id="super-email"
                        type="email"
                        placeholder="superadmin@worklogix.com"
                        value={superAdminData.email}
                        onChange={(e) => setSuperAdminData({ ...superAdminData, email: e.target.value })}
                        required
                        data-testid="input-super-admin-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="super-password">Password</Label>
                      <Input
                        id="super-password"
                        type="password"
                        value={superAdminData.password}
                        onChange={(e) => setSuperAdminData({ ...superAdminData, password: e.target.value })}
                        required
                        data-testid="input-super-admin-password"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500" data-testid="error-message">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-super-admin-login">
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="company-reg">
              <Card>
                <CardHeader>
                  <CardTitle>Register Your Company</CardTitle>
                  <CardDescription>Get your unique Company Server ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompanyRegistration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        type="text"
                        placeholder="Acme Inc"
                        value={companyRegData.name}
                        onChange={(e) => setCompanyRegData({ ...companyRegData, name: e.target.value })}
                        required
                        data-testid="input-company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Company Email</Label>
                      <Input
                        id="company-email"
                        type="email"
                        placeholder="admin@company.com"
                        value={companyRegData.email}
                        onChange={(e) => setCompanyRegData({ ...companyRegData, email: e.target.value })}
                        required
                        data-testid="input-company-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-password">Password</Label>
                      <Input
                        id="company-password"
                        type="password"
                        value={companyRegData.password}
                        onChange={(e) => setCompanyRegData({ ...companyRegData, password: e.target.value })}
                        required
                        data-testid="input-company-password"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500" data-testid="error-message">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register-company">
                      {isLoading ? "Registering..." : "Register Company"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company-admin">
              <Card>
                <CardHeader>
                  <CardTitle>Company Admin Login</CardTitle>
                  <CardDescription>Access your company dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompanyAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-company-name">Company Name</Label>
                      <Input
                        id="admin-company-name"
                        type="text"
                        placeholder="Acme Inc"
                        value={companyAdminData.companyName}
                        onChange={(e) => setCompanyAdminData({ ...companyAdminData, companyName: e.target.value })}
                        required
                        data-testid="input-admin-company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Company Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@company.com"
                        value={companyAdminData.email}
                        onChange={(e) => setCompanyAdminData({ ...companyAdminData, email: e.target.value })}
                        required
                        data-testid="input-admin-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-server-id">Company Server ID</Label>
                      <Input
                        id="admin-server-id"
                        type="text"
                        placeholder="CMP-XYZ123"
                        value={companyAdminData.serverId}
                        onChange={(e) => setCompanyAdminData({ ...companyAdminData, serverId: e.target.value })}
                        required
                        data-testid="input-admin-server-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={companyAdminData.password}
                        onChange={(e) => setCompanyAdminData({ ...companyAdminData, password: e.target.value })}
                        required
                        data-testid="input-admin-password"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500" data-testid="error-message">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-admin-login">
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company-user">
              <Card>
                <CardHeader>
                  <CardTitle>Company User Login</CardTitle>
                  <CardDescription>Access your workspace</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompanyUserLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-username">Username</Label>
                      <Input
                        id="user-username"
                        type="text"
                        placeholder="johndoe"
                        value={companyUserData.username}
                        onChange={(e) => setCompanyUserData({ ...companyUserData, username: e.target.value })}
                        required
                        data-testid="input-user-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-server-id">Company Server ID</Label>
                      <Input
                        id="user-server-id"
                        type="text"
                        placeholder="CMP-XYZ123"
                        value={companyUserData.serverId}
                        onChange={(e) => setCompanyUserData({ ...companyUserData, serverId: e.target.value })}
                        required
                        data-testid="input-user-server-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Password</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={companyUserData.password}
                        onChange={(e) => setCompanyUserData({ ...companyUserData, password: e.target.value })}
                        required
                        data-testid="input-user-password"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500" data-testid="error-message">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-user-login">
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
