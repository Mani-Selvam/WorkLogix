import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import AdminDashboard from "@/components/AdminDashboard";
import UserLayout from "@/components/UserLayout";
import Overview from "@/pages/user/Overview";
import Reports from "@/pages/user/Reports";
import Messages from "@/pages/user/Messages";
import Feedback from "@/pages/user/Feedback";
import Announcements from "@/pages/user/Announcements";
import Tasks from "@/pages/user/Tasks";
import ReportView from "@/pages/user/ReportView";
import Ratings from "@/pages/user/Ratings";

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

function UserRoutes() {
  return (
    <UserLayout>
      <Switch>
        <Route path="/user/overview" component={Overview} />
        <Route path="/user/reports" component={Reports} />
        <Route path="/user/messages" component={Messages} />
        <Route path="/user/feedback" component={Feedback} />
        <Route path="/user/announcements" component={Announcements} />
        <Route path="/user/tasks" component={Tasks} />
        <Route path="/user/report-view" component={ReportView} />
        <Route path="/user/ratings" component={Ratings} />
        <Route path="/user">
          <Redirect to="/user/overview" />
        </Route>
      </Switch>
    </UserLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/user/:rest*">
        {() => <ProtectedRoute component={UserRoutes} allowedRole="user" />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRole="admin" />}
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
