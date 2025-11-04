import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/components/LoginPage";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import ForgotPasswordPage from "@/components/ForgotPasswordPage";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import UserLayout from "@/components/UserLayout";
import AdminLayout from "@/components/AdminLayout";
import Overview from "@/pages/user/Overview";
import Reports from "@/pages/user/Reports";
import Messages from "@/pages/user/Messages";
import Feedback from "@/pages/user/Feedback";
import Announcements from "@/pages/user/Announcements";
import Tasks from "@/pages/user/Tasks";
import ReportView from "@/pages/user/ReportView";
import Ratings from "@/pages/user/Ratings";
import Dashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import AdminReports from "@/pages/admin/AdminReports";
import AdminTasks from "@/pages/admin/AdminTasks";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminRatings from "@/pages/admin/AdminRatings";
import AdminFeedback from "@/pages/admin/AdminFeedback";
import CompanyManagement from "@/pages/admin/CompanyManagement";
import PaymentHistory from "@/pages/admin/PaymentHistory";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import PaymentTracking from "@/pages/super-admin/PaymentTracking";
import ActivityLogs from "@/pages/super-admin/ActivityLogs";

function ProtectedRoute({ component: Component, allowedRole }: { component: any; allowedRole?: "admin" | "user" | "super_admin" }) {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  const isSuperAdmin = userRole === "super_admin";
  const isCompanyAdmin = userRole === "company_admin";
  const isUser = userRole === "company_member";

  if (allowedRole === "super_admin" && !isSuperAdmin) {
    if (isCompanyAdmin) {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/user" />;
  }

  if (allowedRole === "admin" && !isCompanyAdmin && !isSuperAdmin) {
    return <Redirect to="/user" />;
  }

  if (allowedRole === "user" && !isUser) {
    if (isSuperAdmin) {
      return <Redirect to="/super-admin" />;
    }
    return <Redirect to="/admin" />;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={user ? () => <Redirect to="/admin" /> : LandingPage} />
      <Route path="/register" component={LoginPage} />
      <Route path="/login/admin" component={LoginPage} />
      <Route path="/login/user" component={LoginPage} />
      <Route path="/login/company" component={() => <Redirect to="/login/admin" />} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/superadmin" component={SuperAdminLogin} />
      <Route path="/user/overview">
        {() => <ProtectedRoute component={() => <UserLayout><Overview /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/reports">
        {() => <ProtectedRoute component={() => <UserLayout><Reports /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/messages">
        {() => <ProtectedRoute component={() => <UserLayout><Messages /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/feedback">
        {() => <ProtectedRoute component={() => <UserLayout><Feedback /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/announcements">
        {() => <ProtectedRoute component={() => <UserLayout><Announcements /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/tasks">
        {() => <ProtectedRoute component={() => <UserLayout><Tasks /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/report-view">
        {() => <ProtectedRoute component={() => <UserLayout><ReportView /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user/ratings">
        {() => <ProtectedRoute component={() => <UserLayout><Ratings /></UserLayout>} allowedRole="user" />}
      </Route>
      <Route path="/user">
        <Redirect to="/user/overview" />
      </Route>
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={() => <AdminLayout><Dashboard /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={() => <AdminLayout><Users /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/reports">
        {() => <ProtectedRoute component={() => <AdminLayout><AdminReports /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/tasks">
        {() => <ProtectedRoute component={() => <AdminLayout><AdminTasks /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/messages">
        {() => <ProtectedRoute component={() => <AdminLayout><AdminMessages /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/ratings">
        {() => <ProtectedRoute component={() => <AdminLayout><AdminRatings /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/feedback">
        {() => <ProtectedRoute component={() => <AdminLayout><AdminFeedback /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/company">
        {() => <ProtectedRoute component={() => <AdminLayout><CompanyManagement /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin/payment-history">
        {() => <ProtectedRoute component={() => <AdminLayout><PaymentHistory /></AdminLayout>} allowedRole="admin" />}
      </Route>
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/super-admin/dashboard">
        {() => <ProtectedRoute component={() => <AdminLayout><SuperAdminDashboard /></AdminLayout>} allowedRole="super_admin" />}
      </Route>
      <Route path="/super-admin/payments">
        {() => <ProtectedRoute component={() => <AdminLayout><PaymentTracking /></AdminLayout>} allowedRole="super_admin" />}
      </Route>
      <Route path="/super-admin/activity">
        {() => <ProtectedRoute component={() => <AdminLayout><ActivityLogs /></AdminLayout>} allowedRole="super_admin" />}
      </Route>
      <Route path="/super-admin">
        <Redirect to="/super-admin/dashboard" />
      </Route>
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
