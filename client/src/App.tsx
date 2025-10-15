import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
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

function ProtectedRoute({ component: Component, allowedRole }: { component: any; allowedRole?: "admin" | "user" }) {
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

  if (allowedRole && userRole !== allowedRole) {
    return <Redirect to={userRole === "admin" ? "/admin" : "/user"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
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
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
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
