import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/components/LoginPage";
import UserDashboard from "@/components/UserDashboard";
import AdminDashboard from "@/components/AdminDashboard";

function Router() {
  // TODO: Implement proper authentication routing based on Firebase auth state
  // For now, showing different views for demonstration
  const userRole = "user"; // TODO: Get from Firebase auth context
  
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/user" component={UserDashboard} />
      <Route path="/admin" component={AdminDashboard} />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
