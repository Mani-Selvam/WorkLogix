import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  MessageCircle, 
  Megaphone, 
  ListTodo, 
  Eye, 
  Star,
  LogOut 
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

const navItems: NavItem[] = [
  { path: "/user/overview", label: "Overview", icon: LayoutDashboard },
  { path: "/user/reports", label: "Reports", icon: FileText },
  { path: "/user/messages", label: "Messages", icon: MessageSquare },
  { path: "/user/feedback", label: "Feedback", icon: MessageCircle },
  { path: "/user/announcements", label: "Announcements", icon: Megaphone },
  { path: "/user/tasks", label: "Assigned Tasks", icon: ListTodo },
  { path: "/user/report-view", label: "View Reports", icon: Eye },
  { path: "/user/ratings", label: "Ratings", icon: Star },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{user?.displayName}</h3>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t space-y-2">
          <ThemeToggle />
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
